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

    // 2. Automatically assess user's actual daily study time
    const allUserProgress = await prisma.progress.findMany({
      where: { userId },
    });

    let totalWatchedSeconds = 0;
    let completedCount = 0;
    const activeDates = new Set<string>();

    for (const p of allUserProgress) {
      if (p.watchedSeconds && p.watchedSeconds > 0) {
        totalWatchedSeconds += p.watchedSeconds;
      }
      if (p.completed) {
        completedCount++;
      }
      if (p.completedAt) {
        const dStr = new Date(p.completedAt).toISOString().split("T")[0];
        activeDates.add(dStr);
      }
      if (p.updatedAt) {
        const dStr = new Date(p.updatedAt).toISOString().split("T")[0];
        activeDates.add(dStr);
      }
    }

    let trackedHours = totalWatchedSeconds / 3600;

    // Account for completed manual milestones without player watch time
    if (completedCount > 0 && trackedHours < completedCount * 0.5) {
      trackedHours = Math.max(trackedHours, completedCount * 1.25);
    }

    const activeDaysCount = Math.max(1, activeDates.size);

    // Automatically assessed daily pace in hours/day
    let detectedHoursPerDay = trackedHours > 0 ? trackedHours / activeDaysCount : 1.5;
    // Clamp to realistic bounds (between 0.75h/day and 6.0h/day)
    detectedHoursPerDay = Math.min(6.0, Math.max(0.75, Math.round(detectedHoursPerDay * 10) / 10));

    // 3. Analyze workload with hyper-accurate course & item difficulty weights
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

        // Calculate hyper-accurate effort per item
        let itemHours = 0.75;
        const titleLower = item.title.toLowerCase();
        const topicTitleLower = topic.title.toLowerCase();
        const itemDuration = (item as any).duration || p?.duration || 0;

        if (topicTitleLower.includes("deep learning") || titleLower.includes("deep learning")) {
          if (titleLower.includes("part 2") || titleLower.includes("stable diffusion") || titleLower.includes("transformer") || titleLower.includes("latent")) {
            itemHours = 3.5; // Math-heavy implementation from scratch
          } else if (titleLower.includes("part 1") || titleLower.includes("getting started") || titleLower.includes("cnn") || titleLower.includes("nlp")) {
            itemHours = 2.0;
          } else {
            itemHours = 2.5;
          }
        } else if (topicTitleLower.includes("mlops") || titleLower.includes("mlops")) {
          itemHours = 1.75; // Setup, Docker, Orchestration, Deployment
        } else if (topic.kind === "BOOK" || topicTitleLower.includes("(book)")) {
          itemHours = 1.5; // Technical book chapter
        } else if (topic.kind === "PLAYLIST" || item.type === "YOUTUBE_VIDEO") {
          if (itemDuration > 0) {
            itemHours = (itemDuration / 3600) * 1.3; // Video + hands-on coding
          } else {
            itemHours = 0.75;
          }
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
        targetDate: "",
      });
    }

    // 4. Calculate hyper-accurate finish date using automatically assessed pace
    const daysRemaining = Math.ceil(totalHoursRemaining / detectedHoursPerDay);
    const estimatedCompletionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);

    let accumulatedDays = 0;
    for (const tb of topicBreakdowns) {
      if (tb.remainingItems === 0) {
        tb.targetDate = "Completed ✓";
      } else {
        const tbDays = Math.ceil(tb.estimatedHours / detectedHoursPerDay);
        accumulatedDays += tbDays;
        const targetD = new Date(now.getTime() + accumulatedDays * 24 * 60 * 60 * 1000);
        tb.targetDate = targetD.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }

    // 5. Gemini 2.5 Flash AI Reasoning
    let aiReasoning = "";
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const remainingTopicsSummary = topicBreakdowns
          .filter((tb) => tb.remainingItems > 0)
          .map((tb) => `- ${tb.topicTitle}: ${tb.remainingItems} items left (~${tb.estimatedHours} hrs)`)
          .join("\n");

        const promptText = `
You are an expert AI Study Planner for a Machine Learning engineer.
The system automatically assessed the student's actual study pace to be ${detectedHoursPerDay} hours/day based on their tracked video watch time and completion history.
Today's date is ${now.toDateString()}.

Remaining Curriculum:
${remainingTopicsSummary}

Total workload remaining: ${Math.round(totalHoursRemaining)} hours.
Hyper-Accurate Target Finish Date: ${estimatedCompletionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} (${daysRemaining} days remaining).

Write a concise, highly motivating 2 to 3 sentence reasoning explaining why this timeframe is hyper-accurate. Mention their automatically assessed pace (${detectedHoursPerDay}h/day) and the heavy workload of Practical Deep Learning Part 2 vs Part 1 or MLOps/Books. Keep under 75 words.
        `.trim();

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
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
        console.warn("Gemini API call warning (using local AI reasoning):", err);
      }
    }

    if (!aiReasoning) {
      const dlTopic = topicBreakdowns.find((tb) => tb.topicTitle.toLowerCase().includes("deep learning"));
      const dlHours = dlTopic ? dlTopic.estimatedHours : 0;

      aiReasoning = `Based on your automatically assessed pace of ${detectedHoursPerDay} hrs/day, you have ~${Math.round(totalHoursRemaining)} hours of curriculum remaining. Practical Deep Learning Part 2 (3.5h/lesson) and technical books are accurately weighted. You are on track to complete everything by ${estimatedCompletionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`;
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
      detectedHoursPerDay,
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
