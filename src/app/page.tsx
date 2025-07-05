"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  // State variables for user authentication (removed)
  // const [user, setUser] = useState(null);
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [isLoginMode, setIsLoginMode] = useState(true);

  // State variables for user profile inputs
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(70.0);
  const [height, setHeight] = useState(170.0);
  const [sex, setSex] = useState("Male");
  const [activityLevel, setActivityLevel] = useState("Moderately Active");
  const [dietaryPreferences, setDietaryPreferences] = useState("Vegetarian");
  const [fitnessGoals, setFitnessGoals] = useState("Lose Weight");
  const [mood, setMood] = useState("Neutral");
  const [stressLevel, setStressLevel] = useState("Low");

  // Types for generated plans and new features
  interface DietaryPlan {
    why_this_plan_works?: string;
    meal_plan?: string;
    important_considerations?: string;
  }
  interface FitnessPlan {
    goals?: string;
    routine?: string;
    tips?: string;
  }
  interface HolisticWellness {
    mental_wellness_modules?: string;
    sleep_optimization_tips?: string;
    recovery_protocols?: string;
    psychological_prompts?: string;
  }
  interface Gamification {
    user_level_info?: string;
    current_xp?: number;
    tokens_earned?: number;
    dynamic_challenges?: string[];
    mastery_paths?: string[];
  }
  interface Community {
    squad_suggestion?: string;
    content_sharing_ideas?: string;
    expert_integration_info?: string;
    accountability_buddy_idea?: string;
  }
  interface PsychologicalInsights {
    mood_trend_analysis?: string;
    stress_correlation_insight?: string;
    consistency_motivation?: string;
    psychological_nudges?: string[];
  }

  // State for generated plans and new features
  const [dietaryPlan, setDietaryPlan] = useState<DietaryPlan>({});
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan>({});
  const [holisticWellness, setHolisticWellness] = useState<HolisticWellness>(
    {}
  );
  const [gamification, setGamification] = useState<Gamification>({});
  const [community, setCommunity] = useState<Community>({});
  const [psychologicalInsights, setPsychologicalInsights] =
    useState<PsychologicalInsights>({});

  const [qaPairs, setQaPairs] = useState<
    { question: string; answer: string }[]
  >([]);
  const [plansGenerated, setPlansGenerated] = useState(false);
  const [questionInput, setQuestionInput] = useState("");

  // State for API key and loading/error messages

  const geminiApiKey: string = "AIzaSyCqVDOOSbqwM_AS43V_Bmoe239J1h9vahU";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // const [authError, setAuthError] = useState(''); // Specific error for authentication (removed)

  // Firebase state (removed as login system is removed)
  // const [db, setDb] = useState(null);
  // const [auth, setAuth] = useState(null);
  // const [userId, setUserId] = useState(null);

  // Initialize Firebase and handle authentication (removed or simplified)
  useEffect(() => {
    // Since login is removed, Firebase initialization for auth is no longer needed.
    // If Firestore is to be used for other purposes, it would be initialized here.
    // For now, this useEffect can be removed or kept minimal if no other Firebase features are used.
    // For example, if you still want a userId for non-authenticated data storage:
    // setUserId(crypto.randomUUID());
  }, []);

  // Authentication Handlers (removed)
  // const handleAuthAction = async () => { ... };
  // const handleLogout = async () => { ... };

  // Function to call Gemini API
  interface GeminiApiSchema {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  }

  interface GeminiApiCandidate {
    content: {
      parts: { text: string }[];
    };
  }

  interface GeminiApiResponse {
    candidates?: GeminiApiCandidate[];
  }

  const callGeminiApi = async (
    prompt: string,
    isStructured: boolean = false,
    schema: GeminiApiSchema | null = null
  ): Promise<unknown | null> => {
    if (!geminiApiKey) {
      setError("Please enter your Gemini API Key.");
      return null;
    }

    const chatHistory: { role: string; parts: { text: string }[] }[] = [
      { role: "user", parts: [{ text: prompt }] },
    ];
    const payload: {
      contents: { role: string; parts: { text: string }[] }[];
      generationConfig?: {
        responseMimeType: string;
        responseSchema: GeminiApiSchema;
      };
    } = { contents: chatHistory };

    if (isStructured && schema) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: schema,
      };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.status} ${response.statusText} - ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const result: GeminiApiResponse = await response.json();

      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const text = result.candidates[0].content.parts[0].text;
        return isStructured ? JSON.parse(text) : text;
      } else {
        throw new Error("Unexpected API response structure or no content.");
      }
    } catch (err: unknown) {
      console.error("Error calling Gemini API:", err);
      if (err instanceof Error) {
        setError(`Error generating plan: ${err.message}`);
      } else {
        setError("Error generating plan: An unknown error occurred.");
      }
      return null;
    }
  };

  // Handle plan generation
  const handleGeneratePlan = async () => {
    setError("");
    setLoading(true);
    setPlansGenerated(false);

    const userProfile = `
            ${firstName ? `First Name: ${firstName}` : ""}
            Age: ${age}
            Weight: ${weight}kg
            Height: ${height}cm
            Sex: ${sex}
            Activity Level: ${activityLevel}
            Dietary Preferences: ${dietaryPreferences}
            Fitness Goals: ${fitnessGoals}
            Current Mood: ${mood}
            Current Stress Level: ${stressLevel}
        `;

    // Define schema for dietary plan
    const dietarySchema = {
      type: "OBJECT",
      properties: {
        why_this_plan_works: { type: "STRING" },
        meal_plan: { type: "STRING" },
        important_considerations: { type: "STRING" },
      },
      required: [
        "why_this_plan_works",
        "meal_plan",
        "important_considerations",
      ],
    };

    // Define schema for fitness plan
    const fitnessSchema = {
      type: "OBJECT",
      properties: {
        goals: { type: "STRING" },
        routine: { type: "STRING" },
        tips: { type: "STRING" },
      },
      required: ["goals", "routine", "tips"],
    };

    // Define schema for holistic wellness (enhanced)
    const holisticWellnessSchema = {
      type: "OBJECT",
      properties: {
        mental_wellness_modules: { type: "STRING" },
        sleep_optimization_tips: { type: "STRING" },
        recovery_protocols: { type: "STRING" },
        psychological_prompts: { type: "STRING" }, // New field for CBT/mindfulness prompts
      },
      required: [
        "mental_wellness_modules",
        "sleep_optimization_tips",
        "recovery_protocols",
        "psychological_prompts",
      ],
    };

    // Define schema for gamification (enhanced)
    const gamificationSchema = {
      type: "OBJECT",
      properties: {
        user_level_info: { type: "STRING" },
        current_xp: { type: "NUMBER" },
        tokens_earned: { type: "NUMBER" },
        dynamic_challenges: { type: "ARRAY", items: { type: "STRING" } },
        mastery_paths: { type: "ARRAY", items: { type: "STRING" } }, // New field for mastery paths
      },
      required: [
        "user_level_info",
        "current_xp",
        "tokens_earned",
        "dynamic_challenges",
        "mastery_paths",
      ],
    };

    // Define schema for community (enhanced)
    const communitySchema = {
      type: "OBJECT",
      properties: {
        squad_suggestion: { type: "STRING" },
        content_sharing_ideas: { type: "STRING" },
        expert_integration_info: { type: "STRING" },
        accountability_buddy_idea: { type: "STRING" }, // New field for accountability buddies
      },
      required: [
        "squad_suggestion",
        "content_sharing_ideas",
        "expert_integration_info",
        "accountability_buddy_idea",
      ],
    };

    // Define schema for psychological insights
    const psychologicalInsightsSchema = {
      type: "OBJECT",
      properties: {
        mood_trend_analysis: { type: "STRING" },
        stress_correlation_insight: { type: "STRING" },
        consistency_motivation: { type: "STRING" },
        psychological_nudges: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: [
        "mood_trend_analysis",
        "stress_correlation_insight",
        "consistency_motivation",
        "psychological_nudges",
      ],
    };

    try {
      // Generate Dietary Plan
      const dietaryPrompt = `Based on the following user profile, generate a personalized dietary plan.
            User Profile: ${userProfile}
            Provide the output in a JSON format with the following keys: "why_this_plan_works", "meal_plan", "important_considerations".
            For "meal_plan", provide a detailed daily meal plan including breakfast, lunch, dinner, and snacks.
            For "important_considerations", list key considerations for the user, separated by newlines.`;
      const generatedDietaryPlan = await callGeminiApi(
        dietaryPrompt,
        true,
        dietarySchema
      );
      if (generatedDietaryPlan) {
        setDietaryPlan(generatedDietaryPlan);
      } else {
        throw new Error("Failed to generate dietary plan.");
      }

      // Generate Fitness Plan
      const fitnessPrompt = `Based on the following user profile, generate a personalized fitness plan.
            User Profile: ${userProfile}
            Provide the output in a JSON format with the following keys: "goals", "routine", "tips".
            For "routine", provide a detailed exercise routine including warm-up, main workout, and cool-down exercises.
            For "tips", list useful pro tips for the user, separated by newlines.`;
      const generatedFitnessPlan = await callGeminiApi(
        fitnessPrompt,
        true,
        fitnessSchema
      );
      if (generatedFitnessPlan) {
        setFitnessPlan(generatedFitnessPlan);
      } else {
        throw new Error("Failed to generate fitness plan.");
      }

      // Generate Holistic Wellness (enhanced prompt)
      const holisticWellnessPrompt = `Based on the following user profile (especially mood and stress), generate holistic wellness recommendations, including mental wellness modules, sleep optimization tips, recovery protocols, and specific psychological prompts (CBT-inspired or mindfulness exercises).
            User Profile: ${userProfile}
            Provide the output in a JSON format with the following keys: "mental_wellness_modules", "sleep_optimization_tips", "recovery_protocols", "psychological_prompts".
            For "mental_wellness_modules", suggest specific types of meditations, breathing exercises, or journaling prompts.
            For "sleep_optimization_tips", provide actionable advice for better sleep.
            For "recovery_protocols", suggest active recovery or mobility routines.
            For "psychological_prompts", provide 2-3 short CBT-inspired or mindfulness exercises/questions.`;
      const generatedHolisticWellness = await callGeminiApi(
        holisticWellnessPrompt,
        true,
        holisticWellnessSchema
      );
      if (generatedHolisticWellness) {
        setHolisticWellness(generatedHolisticWellness);
      } else {
        throw new Error("Failed to generate holistic wellness plan.");
      }

      // Generate Gamification (enhanced prompt)
      const gamificationPrompt = `Based on the following user profile and fitness goals, suggest gamification elements focusing on intrinsic motivation and mastery paths, along with typical gamification elements.
            User Profile: ${userProfile}
            Provide the output in a JSON format with the following keys: "user_level_info", "current_xp", "tokens_earned", "dynamic_challenges", "mastery_paths".
            For "user_level_info", provide a short motivational message about leveling up.
            For "current_xp" and "tokens_earned", suggest a starting value (e.g., 100 XP, 50 tokens).
            For "dynamic_challenges", provide 3-5 specific, engaging challenges tailored to their goals with a narrative element.
            For "mastery_paths", suggest 2-3 specific skill-based mastery paths they can pursue (e.g., "Yoga Flow Master", "Strength Beast").`;
      const generatedGamification = await callGeminiApi(
        gamificationPrompt,
        true,
        gamificationSchema
      );
      if (generatedGamification) {
        setGamification(generatedGamification);
      } else {
        throw new Error("Failed to generate gamification elements.");
      }

      // Generate Community (enhanced prompt)
      const communityPrompt = `Based on the following user profile and fitness goals, suggest community interaction ideas focusing on peer support and positive reinforcement, including squad suggestions, content sharing ideas, expert integration info, and an idea for an accountability buddy.
            User Profile: ${userProfile}
            Provide the output in a JSON format with the following keys: "squad_suggestion", "content_sharing_ideas", "expert_integration_info", "accountability_buddy_idea".
            For "squad_suggestion", suggest a type of squad they might join (e.g., "Stress Reduction Squad").
            For "content_sharing_ideas", suggest what kind of content they could share to foster positive interaction.
            For "expert_integration_info", suggest how they might interact with experts focusing on mental well-being.
            For "accountability_buddy_idea", suggest a benefit of having an accountability buddy.`;
      const generatedCommunity = await callGeminiApi(
        communityPrompt,
        true,
        communitySchema
      );
      if (generatedCommunity) {
        setCommunity(generatedCommunity);
      } else {
        throw new Error("Failed to generate community features.");
      }

      // Generate Psychological Insights
      const psychologicalInsightsPrompt = `Based on the user's profile, including their mood, stress level, and general fitness goals, provide psychological insights and nudges.
            User Profile: ${userProfile}
            Provide the output in a JSON format with the following keys: "mood_trend_analysis", "stress_correlation_insight", "consistency_motivation", "psychological_nudges".
            For "mood_trend_analysis", provide a general statement about their current mood.
            For "stress_correlation_insight", provide a general insight about stress and fitness.
            For "consistency_motivation", offer a motivational tip for consistency.
            For "psychological_nudges", provide 2-3 actionable, gentle psychological suggestions.`;
      const generatedPsychologicalInsights = await callGeminiApi(
        psychologicalInsightsPrompt,
        true,
        psychologicalInsightsSchema
      );
      if (generatedPsychologicalInsights) {
        setPsychologicalInsights(generatedPsychologicalInsights);
      } else {
        throw new Error("Failed to generate psychological insights.");
      }

      setPlansGenerated(true);
      setQaPairs([]); // Clear Q&A history on new plan generation
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error generating plans: ${err.message}`);
      } else {
        setError("Error generating plans: An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle asking questions about the plan
  const handleGetAnswer = async () => {
    if (!questionInput.trim()) {
      setError("Please enter a question.");
      return;
    }
    setError("");
    setLoading(true);

    // Combine all generated content for context
    const fullContext = `Based on the following personalized plans and features, answer the user's question.
        Dietary Plan: ${dietaryPlan.meal_plan || "No dietary plan available."}
        Fitness Plan: ${fitnessPlan.routine || "No fitness plan available."}
        Holistic Wellness: Mental Wellness: ${
          holisticWellness.mental_wellness_modules || ""
        }, Sleep: ${
      holisticWellness.sleep_optimization_tips || ""
    }, Recovery: ${
      holisticWellness.recovery_protocols || ""
    }, Psychological Prompts: ${holisticWellness.psychological_prompts || ""}
        Gamification: Level: ${
          gamification.user_level_info || ""
        }, Challenges: ${
      gamification.dynamic_challenges?.join(", ") || ""
    }, Mastery Paths: ${gamification.mastery_paths?.join(", ") || ""}
        Community: Squads: ${community.squad_suggestion || ""}, Sharing: ${
      community.content_sharing_ideas || ""
    }, Expert Integration: ${
      community.expert_integration_info || ""
    }, Accountability Buddy: ${community.accountability_buddy_idea || ""}
        Psychological Insights: Mood: ${
          psychologicalInsights.mood_trend_analysis || ""
        }, Stress: ${
      psychologicalInsights.stress_correlation_insight || ""
    }, Nudges: ${psychologicalInsights.psychological_nudges?.join(", ") || ""}
        User Question: ${questionInput}`;

    try {
      const answer = await callGeminiApi(fullContext);
      if (answer) {
        setQaPairs((prev) => [
          ...prev,
          {
            question: questionInput,
            answer:
              typeof answer === "string" ? answer : JSON.stringify(answer),
          },
        ]);
        setQuestionInput(""); // Clear input after asking
      } else {
        throw new Error("Failed to get an answer.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error getting answer: ${err.message}`);
      } else {
        setError("Error getting answer: An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Component to display dietary plan
  const DisplayDietaryPlan = ({
    planContent,
  }: {
    planContent: DietaryPlan;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">
        📋 Your Personalized Dietary Plan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🎯 Why this plan works
          </h3>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4">
            {planContent.why_this_plan_works || "Information not available"}
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🍽️ Meal Plan
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-800">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.meal_plan || "Plan not available"}
            </pre>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            ⚠️ Important Considerations
          </h3>
          <div className="space-y-3">
            {(planContent.important_considerations || "").split("\n").map(
              (consideration, index) =>
                consideration.trim() && (
                  <div
                    key={index}
                    className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg"
                  >
                    {consideration.trim()}
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Component to display fitness plan
  const DisplayFitnessPlan = ({
    planContent,
  }: {
    planContent: FitnessPlan;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-green-800 mb-4">
        💪 Your Personalized Fitness Plan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">🎯 Goals</h3>
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-4">
            {planContent.goals || "Goals not specified"}
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🏋️‍♂️ Exercise Routine
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-800">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.routine || "Routine not available"}
            </pre>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            💡 Pro Tips
          </h3>
          <div className="space-y-3">
            {(planContent.tips || "").split("\n").map(
              (tip, index) =>
                tip.trim() && (
                  <div
                    key={index}
                    className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg"
                  >
                    {tip.trim()}
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // New component for Holistic Wellness (updated)
  const DisplayHolisticWellness = ({
    planContent,
  }: {
    planContent: HolisticWellness;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">
        🧘‍♀️ Holistic Wellness & Recovery
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🧠 Mental Wellness Modules
          </h3>
          <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-lg mb-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.mental_wellness_modules ||
                "Suggestions not available"}
            </pre>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            😴 Sleep Optimization Tips
          </h3>
          <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-lg mb-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.sleep_optimization_tips || "Tips not available"}
            </pre>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🩹 Recovery Protocols
          </h3>
          <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.recovery_protocols || "Protocols not available"}
            </pre>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            💡 Psychological Prompts
          </h3>
          <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.psychological_prompts || "Prompts not available"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  // New component for Gamification (updated)
  const DisplayGamification = ({
    planContent,
  }: {
    planContent: Gamification;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-orange-800 mb-4">
        🎮 Gamification & Rewards
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            ✨ Your Progress
          </h3>
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg mb-4">
            <p className="mb-1">
              <strong>Level:</strong> {planContent.user_level_info || "N/A"}
            </p>
            <p className="mb-1">
              <strong>XP:</strong> {planContent.current_xp || 0}
            </p>
            <p>
              <strong>Tokens:</strong> {planContent.tokens_earned || 0}
            </p>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🚀 Dynamic Challenges
          </h3>
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg mb-4">
            <ul className="list-disc list-inside">
              {(planContent.dynamic_challenges || []).map(
                (challenge, index) => (
                  <li key={index}>{challenge}</li>
                )
              )}
              {(planContent.dynamic_challenges?.length === 0 ||
                !planContent.dynamic_challenges) && (
                <li>No challenges suggested.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🏆 Mastery Paths
          </h3>
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg">
            <ul className="list-disc list-inside">
              {(planContent.mastery_paths || []).map((path, index) => (
                <li key={index}>{path}</li>
              ))}
              {(planContent.mastery_paths?.length === 0 ||
                !planContent.mastery_paths) && (
                <li>No mastery paths suggested.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // New component for Community (updated)
  const DisplayCommunity = ({ planContent }: { planContent: Community }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-teal-800 mb-4">
        🤝 Community & Social Connectivity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            👥 Squad Suggestion
          </h3>
          <div className="bg-teal-50 border border-teal-200 text-teal-800 p-4 rounded-lg mb-4">
            {planContent.squad_suggestion || "No suggestion available"}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            📸 Content Sharing Ideas
          </h3>
          <div className="bg-teal-50 border border-teal-200 text-teal-800 p-4 rounded-lg mb-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.content_sharing_ideas || "No ideas available"}
            </pre>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            👩‍🏫 Expert Integration
          </h3>
          <div className="bg-teal-50 border border-teal-200 text-teal-800 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {planContent.expert_integration_info ||
                "No information available"}
            </pre>
          </div>
        </div>
        <div className="md:col-span-3">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🤝 Accountability Buddy
          </h3>
          <div className="bg-teal-50 border border-teal-200 text-teal-800 p-4 rounded-lg">
            {planContent.accountability_buddy_idea || "No suggestion available"}
          </div>
        </div>
      </div>
    </div>
  );

  // New component for Psychological Insights
  const DisplayPsychologicalInsights = ({
    insightsContent,
  }: {
    insightsContent: PsychologicalInsights;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-pink-800 mb-4">
        🧠 Psychological Insights & Nudges
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            📊 Mood Trend Analysis
          </h3>
          <div className="bg-pink-50 border border-pink-200 text-pink-800 p-4 rounded-lg mb-4">
            {insightsContent.mood_trend_analysis || "No analysis available"}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            🔗 Stress Correlation Insight
          </h3>
          <div className="bg-pink-50 border border-pink-200 text-pink-800 p-4 rounded-lg mb-4">
            {insightsContent.stress_correlation_insight ||
              "No insight available"}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            📈 Consistency Motivation
          </h3>
          <div className="bg-pink-50 border border-pink-200 text-pink-800 p-4 rounded-lg">
            {insightsContent.consistency_motivation ||
              "No motivation tip available"}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            ✨ Psychological Nudges
          </h3>
          <div className="bg-pink-50 border border-pink-200 text-pink-800 p-4 rounded-lg">
            <ul className="list-disc list-inside">
              {(insightsContent.psychological_nudges || []).map(
                (nudge, index) => (
                  <li key={index}>{nudge}</li>
                )
              )}
              {(insightsContent.psychological_nudges?.length === 0 ||
                !insightsContent.psychological_nudges) && (
                <li>No nudges available.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-inter text-gray-900 p-4 sm:p-8">
      {/* Tailwind CSS is included via npm and imported in your global CSS */}
      {/* Inter font from Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
                body {
                    font-family: 'Inter', sans-serif;
                }
                button {
                    width: 100%;
                    border-radius: 0.5rem;
                    height: 3em;
                    background-color: #4f46e5; /* Indigo 600 */
                    color: white;
                    font-weight: 600;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #4338ca; /* Indigo 700 */
                }
                input[type="number"], input[type="text"], input[type="password"], select {
                    border-radius: 0.5rem;
                    border: 1px solid #d1d5db;
                    padding: 0.75rem 1rem;
                    width: 100%; /* Ensure inputs take full width */
                }
                .stSpinner > div {
                    color: #4f46e5;
                }
            `}</style>

      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10">
        <h1 className="text-4xl font-extrabold text-center text-indigo-800 mb-6">
          🏋️‍♂️ NoCap Fitness
        </h1>
        <div className="bg-indigo-700 text-white p-6 rounded-xl mb-8 text-center text-lg">
          {firstName ? `Welcome, ${firstName}! ` : ""}Get personalized dietary
          and fitness plans tailored to your goals and preferences. Our
          **professionally powered** system considers your unique profile to
          create the perfect plan for you.
        </div>

        {/* API Configuration */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Gemini API Key Input */}

          {/* Go to Mental Page Button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <a
              href="/mental"
              className="inline-block w-full sm:w-auto py-3 px-6 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 ease-in-out text-center"
            >
              🧠 Check Mental Wellbeing
            </a>
          </div>
        </div>
        {/* User Profile Inputs (always visible now) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            👤 Your Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* First Name Input */}
            <div className="md:col-span-2">
              <label
                htmlFor="firstName"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="age"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Age
              </label>
              <input
                type="number"
                id="age"
                min="10"
                max="100"
                step="1"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="weight"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                min="20.0"
                max="300.0"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="height"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                min="100.0"
                max="250.0"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="sex"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Sex
              </label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="activityLevel"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Activity Level
              </label>
              <select
                id="activityLevel"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Sedentary</option>
                <option>Lightly Active</option>
                <option>Moderately Active</option>
                <option>Very Active</option>
                <option>Extremely Active</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="dietaryPreferences"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Dietary Preferences
              </label>
              <select
                id="dietaryPreferences"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Vegetarian</option>
                <option>Keto</option>
                <option>Gluten Free</option>
                <option>Low Carb</option>
                <option>Dairy Free</option>
                <option>None</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="fitnessGoals"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Fitness Goals
              </label>
              <select
                id="fitnessGoals"
                value={fitnessGoals}
                onChange={(e) => setFitnessGoals(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Lose Weight</option>
                <option>Gain Muscle</option>
                <option>Endurance</option>
                <option>Stay Fit</option>
                <option>Strength Training</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="mood"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Current Mood
              </label>
              <select
                id="mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Excellent</option>
                <option>Good</option>
                <option>Neutral</option>
                <option>Low</option>
                <option>Stressed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="stressLevel"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                Current Stress Level
              </label>
              <select
                id="stressLevel"
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating your perfect routine...
              </span>
            ) : (
              "🎯 Generate My Personalized Plan"
            )}
          </button>
          {error && <p className="text-red-600 text-center mt-4">{error}</p>}
        </div>

        {plansGenerated && (
          <>
            <DisplayDietaryPlan planContent={dietaryPlan} />
            <DisplayFitnessPlan planContent={fitnessPlan} />
            <DisplayHolisticWellness planContent={holisticWellness} />
            <DisplayGamification planContent={gamification} />
            <DisplayCommunity planContent={community} />
            <DisplayPsychologicalInsights
              insightsContent={psychologicalInsights}
            />

            {/* Q&A Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                ❓ Questions about your plan?
              </h2>
              <input
                type="text"
                placeholder="What would you like to know?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleGetAnswer();
                  }
                }}
              />
              <button
                onClick={handleGetAnswer}
                className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Finding the best answer for you...
                  </span>
                ) : (
                  "Get Answer"
                )}
              </button>
              {error && (
                <p className="text-red-600 text-center mt-4">{error}</p>
              )}
            </div>

            {qaPairs.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  💬 Q&A History
                </h2>
                <div className="space-y-6">
                  {qaPairs.map((item, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="font-semibold text-indigo-700 mb-1">
                        Q: {item.question}
                      </p>
                      <p className="text-gray-800">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
