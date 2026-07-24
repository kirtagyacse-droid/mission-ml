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

    // 2. Analyze user's progress for:
    // a) Actual daily study clock time
    // b) Effective playback speed ratio (Content Duration Covered / Actual Clock Seconds Spent)
    const allUserProgress = await prisma.progress.findMany({
      where: { userId },
    });

    let totalWatchedSeconds = 0; // Actual clock time spent watching
    let totalContentSecondsCovered = 0; // Nominal content duration covered
    let completedCount = 0;
    const activeDates = new Set<string>();

    for (const p of allUserProgress) {
      if (p.watchedSeconds && p.watchedSeconds > 0) {
        totalWatchedSeconds += p.watchedSeconds;
        const dur = p.duration || 0;
        if (dur > 0) {
          totalContentSecondsCovered += Math.min(dur, p.watchedSeconds * 2.5);
        } else {
          totalContentSecondsCovered += p.watchedSeconds * 1.35; // Default 1.35x speed factor if video duration missing
        }
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

    let trackedClockHours = totalWatchedSeconds / 3600;

    // Account for completed manual milestones without player watch time
    if (completedCount > 0 && trackedClockHours < completedCount * 0.5) {
      trackedClockHours = Math.max(trackedClockHours, completedCount * 1.25);
    }

    const activeDaysCount = Math.max(1, activeDates.size);

    // Automatically assessed daily study clock time (hours/day)
    let detectedHoursPerDay = trackedClockHours > 0 ? trackedClockHours / activeDaysCount : 1.5;
    detectedHoursPerDay = Math.min(6.0, Math.max(0.75, Math.round(detectedHoursPerDay * 10) / 10));

    // Calculate intelligent Playback Speed Factor (e.g., 1.25x, 1.5x, 1.75x)
    let playbackSpeedFactor = 1.35; // Smart default baseline for fast video learners
    if (totalWatchedSeconds > 300 && totalContentSecondsCovered > 300) {
      const calculatedSpeed = totalContentSecondsCovered / totalWatchedSeconds;
      playbackSpeedFactor = Math.min(2.5, Math.max(1.1, calculatedSpeed));
    }
    playbackSpeedFactor = Math.round(playbackSpeedFactor * 100) / 100;

    // 3. Analyze workload with hyper-accurate course & item difficulty weights
    let totalContentHoursRemaining = 0;
    let completedItemsCount = 0;
    let totalItemsCount = 0;

    const topicBreakdowns: Array<{
      topicId: string;
      topicTitle: string;
      totalItems: number;
      completedItems: number;
      remainingItems: number;
      contentHours: number;
      actualClockHours: number;
      targetDate: string;
    }> = [];

    const now = new Date();

    for (const topic of topics) {
      let topicRemainingContentHours = 0;
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

        // Calculate raw content hours per item
        let itemContentHours = 0.75;
        const titleLower = item.title.toLowerCase();
        const topicTitleLower = topic.title.toLowerCase();
        const itemDuration = (item as any).duration || p?.duration || 0;

        if (topicTitleLower.includes("deep learning") || titleLower.includes("deep learning")) {
          if (titleLower.includes("part 2") || titleLower.includes("stable diffusion") || titleLower.includes("transformer") || titleLower.includes("latent")) {
            itemContentHours = 3.5; // Math-heavy implementation from scratch
          } else if (titleLower.includes("part 1") || titleLower.includes("getting started") || titleLower.includes("cnn") || titleLower.includes("nlp")) {
            itemContentHours = 2.0;
          } else {
            itemContentHours = 2.5;
          }
        } else if (topicTitleLower.includes("mlops") || titleLower.includes("mlops")) {
          itemContentHours = 1.75; // Setup, Docker, Orchestration, Deployment
        } else if (topic.kind === "BOOK" || topicTitleLower.includes("(book)")) {
          itemContentHours = 1.5; // Technical book chapter
        } else if (topic.kind === "PLAYLIST" || item.type === "YOUTUBE_VIDEO") {
          if (itemDuration > 0) {
            itemContentHours = (itemDuration / 3600) * 1.25; // Video duration + hands-on code
          } else {
            itemContentHours = 0.75;
          }
        } else {
          itemContentHours = 1.0;
        }

        topicRemainingContentHours += itemContentHours;
      }

      totalContentHoursRemaining += topicRemainingContentHours;

      // Adjust for playback speed factor for video/lecture topics
      const topicIsBook = topic.kind === "BOOK" || topic.title.toLowerCase().includes("(book)");
      const topicSpeed = topicIsBook ? 1.1 : playbackSpeedFactor;
      const topicClockHours = topicRemainingContentHours / topicSpeed;

      topicBreakdowns.push({
        topicId: topic.id,
        topicTitle: topic.title,
        totalItems: topicTotal,
        completedItems: topicCompleted,
        remainingItems: topicTotal - topicCompleted,
        contentHours: Math.round(topicRemainingContentHours * 10) / 10,
        actualClockHours: Math.round(topicClockHours * 10) / 10,
        targetDate: "",
      });
    }

    // 4. Calculate actual clock hours needed considering playback speed factor
    const actualClockHoursRemaining = Math.round((totalContentHoursRemaining / playbackSpeedFactor) * 10) / 10;
    const daysRemaining = Math.ceil(actualClockHoursRemaining / detectedHoursPerDay);
    const estimatedCompletionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);

    let accumulatedDays = 0;
    for (const tb of topicBreakdowns) {
      if (tb.remainingItems === 0) {
        tb.targetDate = "Completed ✓";
      } else {
        const tbDays = Math.ceil(tb.actualClockHours / detectedHoursPerDay);
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
          .map((tb) => `- ${tb.topicTitle}: ${tb.remainingItems} items left (~${tb.contentHours}h content → ~${tb.actualClockHours}h actual clock time)`)
          .join("\n");

        const promptText = `
You are an expert AI Study Planner for a Machine Learning engineer.
Student's Automatically Assessed Metrics:
- Playback Speed Factor: ${playbackSpeedFactor}x average (student watches video lectures at faster playback speeds e.g. 1.25x-2x).
- Daily Study Pace: ${detectedHoursPerDay} actual clock hours/day.
- Total Remaining Workload: ${Math.round(totalContentHoursRemaining)} hours of content → only ${actualClockHoursRemaining} actual clock study hours needed due to ${playbackSpeedFactor}x playback speed!
- Today's Date: ${now.toDateString()}.
- Target Completion Date: ${estimatedCompletionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} (${daysRemaining} days left).

Remaining Curriculum Breakdown:
${remainingTopicsSummary}

Write a concise, highly motivating 2 to 3 sentence insight explaining how their ${playbackSpeedFactor}x playback speed reduces ${Math.round(totalContentHoursRemaining)}h of content into ${actualClockHoursRemaining}h of real study time, allowing them to finish by ${estimatedCompletionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Keep under 75 words.
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
        console.warn("Gemini API call warning:", err);
      }
    }

    if (!aiReasoning) {
      aiReasoning = `By watching lectures at an effective ~${playbackSpeedFactor}x playback speed, your ${Math.round(totalContentHoursRemaining)} hours of course content is condensed into just ~${actualClockHoursRemaining} actual study hours. At your current pace of ${detectedHoursPerDay} hrs/day, you are on track to complete everything by ${estimatedCompletionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`;
    }

    return NextResponse.json({
      totalContentHoursRemaining: Math.round(totalContentHoursRemaining * 10) / 10,
      actualClockHoursRemaining,
      playbackSpeedFactor,
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
