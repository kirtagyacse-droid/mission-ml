import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as any).userId;
    const body = await req.json().catch(() => ({}));
    const hoursPerDay = Number(body.hoursPerDay) || 2; // Default 2 hrs/day

    // 1. Fetch user's topics, items, and progress
    const topics = await prisma.topic.findMany({
      orderBy: { order: "asc" },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            progress: {
              where: { userId },
            },
          },
        },
      },
    });

    // 2. Analyze workload with intelligent topic weights
    let totalHoursRemaining = 0;
    let completedItemsCount = 0;
    let totalItemsCount = 0;

    const topicBreakdowns: Array<{
      topicId: string;
      topicTitle: string;
      totalItems: number;
      completedItems: number;
      remainingItems: number;
      estimatedHours: number;
      targetDate: string;
    }> = [];

    const now = new Date();

    for (const topic of topics) {
      let topicRemainingHours = 0;
      let topicCompleted = 0;
      const topicTotal = topic.items.length;

      for (const item of topic.items) {
        totalItemsCount++;
        const p = item.progress[0];
        const isDone = p?.completed;

        if (isDone) {
          completedItemsCount++;
          topicCompleted++;
          continue;
        }

        // Calculate realistic effort per item based on title and topic kind
        let itemHours = 0.5; // default 30 mins

        const titleLower = item.title.toLowerCase();
        const topicTitleLower = topic.title.toLowerCase();

        const itemDuration = (item as any).duration || p?.duration || 0;

        if (topicTitleLower.includes("deep learning")) {
          if (titleLower.includes("part 2") || titleLower.includes("stable diffusion") || titleLower.includes("transformer") || titleLower.includes("latent")) {
            // Part 2 of Practical Deep Learning is math-heavy & code intensive
            itemHours = 3.0;
          } else if (titleLower.includes("part 1") || titleLower.includes("getting started") || titleLower.includes("cnn") || titleLower.includes("nlp")) {
            // Part 1 of Practical Deep Learning
            itemHours = 2.0;
          } else {
            itemHours = 2.5;
          }
        } else if (topic.kind === "BOOK" || topicTitleLower.includes("(book)")) {
          // Book chapters
          itemHours = 1.5;
        } else if (topic.kind === "PLAYLIST") {
          if (itemDuration > 0) {
            // Video length + 50% for note-taking and coding exercises
            itemHours = (itemDuration / 3600) * 1.5;
          } else {
            itemHours = 0.6; // ~35 mins
          }
        } else if (itemDuration > 0) {
          itemHours = (itemDuration / 3600) * 1.4;
        } else {
          itemHours = 1.0;
        }

        topicRemainingHours += itemHours;
      }

      totalHoursRemaining += topicRemainingHours;

      topicBreakdowns.push({
        topicId: topic.id,
        topicTitle: topic.title,
        totalItems: topicTotal,
        completedItems: topicCompleted,
        remainingItems: topicTotal - topicCompleted,
        estimatedHours: Math.round(topicRemainingHours * 10) / 10,
        targetDate: "", // Calculated below cumulatively
      });
    }

    // Cumulative date projections based on study pace
    const daysRemaining = hoursPerDay > 0 ? Math.ceil(totalHoursRemaining / hoursPerDay) : 999;
    const estimatedCompletionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);

    let accumulatedDays = 0;
    for (const tb of topicBreakdowns) {
      if (tb.remainingItems === 0) {
        tb.targetDate = "Completed ✓";
      } else {
        const tbDays = Math.ceil(tb.estimatedHours / hoursPerDay);
        accumulatedDays += tbDays;
        const targetD = new Date(now.getTime() + accumulatedDays * 24 * 60 * 60 * 1000);
        tb.targetDate = targetD.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }

    let aiReasoning = "";

    // 3. Optional Gemini API Reasoning
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const remainingTopicsSummary = topicBreakdowns
          .filter((tb) => tb.remainingItems > 0)
          .map((tb) => `- ${tb.topicTitle}: ${tb.remainingItems} items left (~${tb.estimatedHours} hrs)`)
          .join("\n");

        const promptText = `
You are an expert AI Study Assistant for a Machine Learning engineer.
The student is studying Machine Learning & Deep Learning with a target pace of ${hoursPerDay} hours/day.
Today's date is ${now.toDateString()}.

Remaining curriculum summary:
${remainingTopicsSummary}

Total estimated hours remaining: ${Math.round(totalHoursRemaining)} hours.
Estimated days to completion: ${daysRemaining} days (Target Finish: ${estimatedCompletionDate.toLocaleDateString()}).

Provide a concise, highly motivating 2 to 3 sentence reasoning explaining why this timeframe is realistic. Specifically mention the workload of Practical Deep Learning Part 1 vs Part 2 or heavy book chapters. Do not include markdown code blocks. Keep it under 70 words.
        `.trim();

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
            }),
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOutput) {
            aiReasoning = textOutput.trim();
          }
        }
      } catch (err) {
        console.warn("Gemini API call warning (falling back to local AI engine):", err);
      }
    }

    // Fallback AI reasoning if Gemini API key wasn't supplied or returned error
    if (!aiReasoning) {
      const dlTopic = topicBreakdowns.find((tb) => tb.topicTitle.toLowerCase().includes("deep learning"));
      const dlHours = dlTopic ? dlTopic.estimatedHours : 0;

      aiReasoning = `Based on workload complexity, you have ~${Math.round(totalHoursRemaining)} hours of curriculum left. Practical Deep Learning (especially Part 2: Stable Diffusion & Transformers) requires ~${Math.round(dlHours)} hours of deep hands-on coding. At ${hoursPerDay}h/day, you are on track to complete everything by ${estimatedCompletionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`;
    }

    return NextResponse.json({
      totalHoursRemaining: Math.round(totalHoursRemaining * 10) / 10,
      daysRemaining,
      estimatedCompletionDate: estimatedCompletionDate.toISOString(),
      formattedDate: estimatedCompletionDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      hoursPerDay,
      completedItemsCount,
      totalItemsCount,
      aiReasoning,
      topicBreakdowns,
    });
  } catch (error: any) {
    console.error("AI ETA API error:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate AI ETA" }, { status: 500 });
  }
}
