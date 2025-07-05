import React, { useState, useEffect } from "react";

// Main App component
const App = () => {
  // State for form inputs
  const [mentalState, setMentalState] = useState("");
  const [sleepPattern, setSleepPattern] = useState("7");
  const [stressLevel, setStressLevel] = useState(5);
  const [supportSystem, setSupportSystem] = useState([]);
  const [recentChanges, setRecentChanges] = useState("");
  const [currentSymptoms, setCurrentSymptoms] = useState([]);
  const [apiKey, setApiKey] = useState("");

  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

  // State for generated content
  const [assessmentContent, setAssessmentContent] = useState(
    "<p>Content will appear here...</p>"
  );
  const [actionContent, setActionContent] = useState(
    "<p>Content will appear here...</p>"
  );
  const [followupContent, setFollowupContent] = useState(
    "<p>Content will appear here...</p>"
  );

  // State for expander visibility
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(false);
  const [isActionExpanded, setIsActionExpanded] = useState(false);
  const [isFollowupExpanded, setIsFollowupExpanded] = useState(false);

  // System messages for different agents
  const systemMessages = {
    assessment_agent: `
            You are an experienced mental health professional speaking directly to the user. Your task is to:
            1. Create a safe space by acknowledging their courage in seeking support
            2. Analyze their emotional state with clinical precision and genuine empathy
            3. Ask targeted follow-up questions to understand their full situation
            4. Identify patterns in their thoughts, behaviors, and relationships
            5. Assess risk levels with validated screening approaches
            6. Help them understand their current mental health in accessible language
            7. Validate their experiences without minimizing or catastrophizing

            Always use "you" and "your" when addressing the user. Blend clinical expertise with genuine warmth and never rush to conclusions.
            Start your response with: '## Situation Assessment'.
        `,
    action_agent: `
            You are a crisis intervention and resource specialist speaking directly to the user. Your task is to:
            1. Provide immediate evidence-based coping strategies tailored to their specific situation
            2. Prioritize interventions based on urgency and effectiveness
            3. Connect them with appropriate mental health services while acknowledging barriers (cost, access, stigma)
            4. Create a concrete daily wellness plan with specific times and activities
            5. Suggest specific support communities with details on how to join
            6. Balance crisis resources with empowerment techniques
            7. Teach simple self-regulation techniques they can use immediately

            Focus on practical, achievable steps that respect their current capacity and energy levels. Provide options ranging from minimal effort to more involved actions.
            Start your response with: '## Action Plan & Resources'.
        `,
    followup_agent: `
            You are a mental health recovery planner speaking directly to the user. Your task is to:
            1. Design a personalized long-term support strategy with milestone markers
            2. Create a progress monitoring system that matches their preferences and habits
            3. Develop specific relapse prevention strategies based on their unique triggers
            4. Establish a support network mapping exercise to identify existing resources
            5. Build a graduated self-care routine that evolves with their recovery
            6. Plan for setbacks with self-compassion techniques
            7. Set up a maintenance schedule with clear check-in mechanisms

            Focus on building sustainable habits that integrate with their lifestyle and values. Emphasize progress over perfection and teach skills for self-directed care.
            Start your response with: '## Long-term Support Strategy'.
        `,
  };

  // Effect to populate sleep pattern options on component mount
  useEffect(() => {
    // This effect is not strictly necessary for React as options can be mapped directly in JSX,
    // but keeping it here to reflect the original JS logic if needed for more complex dynamic options.
  }, []);

  /**
   * Toggles the visibility of an expander section.
   * @param {function} setter The state setter function for the expander's visibility.
   * @param {boolean} currentStatus The current visibility status.
   */
  const toggleExpander = (setter, currentStatus) => {
    setter(!currentStatus);
  };

  /**
   * Calls the Gemini API to generate content based on the prompt and system message.
   * @param {string} prompt The user's input or context for the model.
   * @param {string} systemMessage The persona/instructions for the model.
   * @param {string} currentApiKey The API key for authentication.
   * @returns {Promise<string>} The generated text from the model.
   */
  const callGeminiAPI = async (prompt, systemMessage, currentApiKey) => {
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: systemMessage }] });
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    // Use the provided API key or an empty string for default injection
    const effectiveApiKey = currentApiKey || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${effectiveApiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.status} ${
            response.statusText
          } - ${JSON.stringify(errorData)}`
        );
      }

      const result = await response.json();
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        return result.candidates[0].content.parts[0].text;
      } else {
        throw new Error(
          "Unexpected API response structure or no content generated."
        );
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  };

  // Handler for the "Get Support Plan" button click
  const handleGetSupportPlan = async () => {
    if (!apiKey && typeof __api_key === "undefined") {
      // Check if API key is truly missing
      setErrorMessage("Please enter your API key.");
      setSuccessMessage(false);
      return;
    }

    // Reset messages and content
    setErrorMessage("");
    setSuccessMessage(false);
    setAssessmentContent("<p>Content will appear here...</p>");
    setActionContent("<p>Content will appear here...</p>");
    setFollowupContent("<p>Content will appear here...</p>");

    // Show loading state
    setIsLoading(true);

    const baseTask = `
            Create a comprehensive mental health support plan based on the following information:

            Emotional State: ${mentalState || "Not provided"}
            Sleep: ${sleepPattern} hours per night
            Stress Level: ${stressLevel}/10
            Support System: ${
              supportSystem.length ? supportSystem.join(", ") : "None reported"
            }
            Recent Changes: ${recentChanges || "None reported"}
            Current Symptoms: ${
              currentSymptoms.length
                ? currentSymptoms.join(", ")
                : "None reported"
            }
        `;

    try {
      // 1. Assessment Agent
      const assessmentPrompt = `
                ${baseTask}

                Your task is to provide a detailed situation assessment. Focus on understanding the user's current mental health state, identifying patterns, and validating their experiences.
            `;
      const generatedAssessment = await callGeminiAPI(
        assessmentPrompt,
        systemMessages.assessment_agent,
        apiKey
      );
      setAssessmentContent(generatedAssessment);

      // 2. Action Agent
      const actionPrompt = `
                ${baseTask}

                Based on the following assessment:
                ${generatedAssessment}

                Your task is to create a concrete action plan with immediate coping strategies, relevant resources, daily wellness activities, and support community suggestions.
            `;
      const generatedAction = await callGeminiAPI(
        actionPrompt,
        systemMessages.action_agent,
        apiKey
      );
      setActionContent(generatedAction);

      // 3. Follow-up Agent
      const followupPrompt = `
                ${baseTask}

                Based on the following assessment and action plan:
                Assessment:
                ${generatedAssessment}

                Action Plan:
                ${generatedAction}

                Your task is to design a personalized long-term support strategy, including progress monitoring, relapse prevention, support network mapping, and a maintenance schedule.
            `;
      const generatedFollowup = await callGeminiAPI(
        followupPrompt,
        systemMessages.followup_agent,
        apiKey
      );
      setFollowupContent(generatedFollowup);

      setSuccessMessage(true);
    } catch (e) {
      setErrorMessage(`An error occurred: ${e.message}`);
      console.error("Full error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="container">
        {/* Sidebar content replicated at the top for simplicity */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            OpenAI API Key
          </h2>
          <input
            type="password"
            id="api-key"
            placeholder="Enter your OpenAI API Key"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md">
            <h3 className="font-bold text-lg mb-2">⚠️ Important Notice</h3>
            <p className="text-sm">
              This application is a supportive tool and does not replace
              professional mental health care. If you're experiencing thoughts
              of self-harm or severe crisis:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>Call National Crisis Hotline: 988</li>
              <li>Call Emergency Services: 911</li>
              <li>Seek immediate professional help</li>
            </ul>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          🧠 Mental Wellbeing Agent
        </h1>

        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md mb-6">
          <h2 className="font-bold text-lg mb-2">
            Meet Your Mental Wellbeing Agent Team:
          </h2>
          <ul className="list-disc list-inside text-sm">
            <li>
              🧠 <strong className="font-semibold">Assessment Agent</strong> -
              Analyzes your situation and emotional needs
            </li>
            <li>
              🎯 <strong className="font-semibold">Action Agent</strong> -
              Creates immediate action plan and connects you with resources
            </li>
            <li>
              🔄 <strong className="font-semibold">Follow-up Agent</strong> -
              Designs your long-term support strategy
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label
              htmlFor="mental-state"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              How have you been feeling recently?
            </label>
            <textarea
              id="mental-state"
              rows="4"
              placeholder="Describe your emotional state, thoughts, or concerns..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={mentalState}
              onChange={(e) => setMentalState(e.target.value)}
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="stress-level"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Stress Level (1-10)
            </label>
            <input
              type="range"
              id="stress-level"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-600"
            />
            <span
              id="stress-level-value"
              className="block text-right text-sm text-gray-600 mt-1"
            >
              {stressLevel}
            </span>
          </div>
          <div>
            <label
              htmlFor="sleep-pattern"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sleep Pattern (hours per night)
            </label>
            <select
              id="sleep-pattern"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={sleepPattern}
              onChange={(e) => setSleepPattern(e.target.value)}
            >
              {Array.from({ length: 13 }, (_, i) => (
                <option key={i} value={i}>
                  {i} hours
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="support-system"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Support System
            </label>
            <select
              id="support-system"
              multiple
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 h-32"
              value={supportSystem}
              onChange={(e) =>
                setSupportSystem(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
            >
              <option value="Family">Family</option>
              <option value="Friends">Friends</option>
              <option value="Therapist">Therapist</option>
              <option value="Support Groups">Support Groups</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="recent-changes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Any significant life changes or events recently?
          </label>
          <textarea
            id="recent-changes"
            rows="3"
            placeholder="Job changes, relationships, losses, etc..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            value={recentChanges}
            onChange={(e) => setRecentChanges(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-6">
          <label
            htmlFor="current-symptoms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Current Symptoms
          </label>
          <select
            id="current-symptoms"
            multiple
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 h-40"
            value={currentSymptoms}
            onChange={(e) =>
              setCurrentSymptoms(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
          >
            <option value="Anxiety">Anxiety</option>
            <option value="Depression">Depression</option>
            <option value="Insomnia">Insomnia</option>
            <option value="Fatigue">Fatigue</option>
            <option value="Loss of Interest">Loss of Interest</option>
            <option value="Difficulty Concentrating">
              Difficulty Concentrating
            </option>
            <option value="Changes in Appetite">Changes in Appetite</option>
            <option value="Social Withdrawal">Social Withdrawal</option>
            <option value="Mood Swings">Mood Swings</option>
            <option value="Physical Discomfort">Physical Discomfort</option>
          </select>
        </div>

        <button
          id="get-support-btn"
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out flex items-center justify-center"
          onClick={handleGetSupportPlan}
          disabled={isLoading}
        >
          <span id="button-text">
            {isLoading ? "AI Agents are analyzing..." : "Get Support Plan"}
          </span>
          {isLoading && (
            <div id="loading-spinner" className="spinner ml-3"></div>
          )}
        </button>

        {errorMessage && (
          <div
            id="error-message"
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mt-4"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline" id="error-text">
              {errorMessage}
            </span>
          </div>
        )}

        {successMessage && (
          <div
            id="success-message"
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mt-4"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline">
              Mental health support plan generated successfully!
            </span>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <div
            className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm ${
              isAssessmentExpanded ? "expanded" : ""
            }`}
          >
            <button
              className="w-full flex items-center justify-between p-4 font-semibold text-lg text-gray-800 focus:outline-none"
              onClick={() =>
                toggleExpander(setIsAssessmentExpanded, isAssessmentExpanded)
              }
            >
              Situation Assessment
              <svg
                className="w-5 h-5 text-gray-500 expand-button"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
            {isAssessmentExpanded && (
              <div
                id="assessment-content"
                className="px-4 pb-4 text-gray-700"
                dangerouslySetInnerHTML={{ __html: assessmentContent }}
              ></div>
            )}
          </div>

          <div
            className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm ${
              isActionExpanded ? "expanded" : ""
            }`}
          >
            <button
              className="w-full flex items-center justify-between p-4 font-semibold text-lg text-gray-800 focus:outline-none"
              onClick={() =>
                toggleExpander(setIsActionExpanded, isActionExpanded)
              }
            >
              Action Plan & Resources
              <svg
                className="w-5 h-5 text-gray-500 expand-button"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
            {isActionExpanded && (
              <div
                id="action-content"
                className="px-4 pb-4 text-gray-700"
                dangerouslySetInnerHTML={{ __html: actionContent }}
              ></div>
            )}
          </div>

          <div
            className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm ${
              isFollowupExpanded ? "expanded" : ""
            }`}
          >
            <button
              className="w-full flex items-center justify-between p-4 font-semibold text-lg text-gray-800 focus:outline-none"
              onClick={() =>
                toggleExpander(setIsFollowupExpanded, isFollowupExpanded)
              }
            >
              Long-term Support Strategy
              <svg
                className="w-5 h-5 text-gray-500 expand-button"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
            {isFollowupExpanded && (
              <div
                id="followup-content"
                className="px-4 pb-4 text-gray-700"
                dangerouslySetInnerHTML={{ __html: followupContent }}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
