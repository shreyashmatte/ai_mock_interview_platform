
"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        const { text } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: `
Return ONLY valid JSON in this exact format:

{
  "totalScore": number,
  "categoryScores": [
    {
      "name": "Communication Skills",
      "score": number,
      "comment": string
    },
    {
      "name": "Technical Knowledge",
      "score": number,
      "comment": string
    },
    {
      "name": "Problem-Solving",
      "score": number,
      "comment": string
    },
    {
      "name": "Cultural & Role Fit",
      "score": number,
      "comment": string
    },
    {
      "name": "Confidence & Clarity",
      "score": number,
      "comment": string
    }
  ],
  "strengths": string[],
  "areasForImprovement": string[],
  "finalAssessment": string
}

Transcript:
${formattedTranscript}
`,
        });

        // 🔥 Clean markdown if Gemini wraps JSON
        const cleanedText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleanedText);

        // ✅ Save correct structure for frontend
        const docRef = await db.collection("feedback").add({
            interviewId,
            userId,
            totalScore: parsed.totalScore,
            categoryScores: parsed.categoryScores,
            strengths: parsed.strengths,
            areasForImprovement: parsed.areasForImprovement,
            finalAssessment: parsed.finalAssessment,
            createdAt: new Date().toISOString(),
        });

        return { success: true, feedbackId: docRef.id };

    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false };
    }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db.collection("interviews").doc(id).get();

    return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const querySnapshot = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}
export async function getInterviewsByUserId(userId: string): Promise<Interview[]>{
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }))as Interview[];
}
export async function  getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[]>{
    const { userId ,limit = 20 } = params;

    const interviews = await db
        .collection("interviews")
        .where("finalized", "==", true)
        .where('userId', '!=', userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }))as Interview[];
};



