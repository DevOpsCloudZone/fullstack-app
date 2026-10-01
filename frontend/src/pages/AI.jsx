
import "./AI.css";

const aiTopics = [
  {
    title: "AI Agents",
    description: "AI systems that use tools and perform tasks toward a goal.",
    icon: "🤖",
    screen: "ai-agents",
    details:
      "AI agents combine a model with instructions, tools, and a workflow to help complete tasks. Explore tool use, memory, planning, and practical applications.",
  },
  {
    title: "Agentic AI",
    description: "Systems that plan and execute multi-step workflows.",
    icon: "⚙️",
    screen: "agentic-ai",
    details:
      "Agentic AI describes systems designed to pursue goals through actions and multi-step decisions. Learn about planning, tool selection, feedback loops, and human oversight.",
  },
  {
    title: "RAG",
    description: "Connect language models with external knowledge sources.",
    icon: "📚",
    screen: "rag",
    details:
      "Retrieval-Augmented Generation retrieves relevant information from documents or other knowledge sources and supplies it to a language model to help ground its response.",
  },
  {
    title: "LLMs",
    description: "Explore large language models and how they work.",
    icon: "🧠",
    screen: "llms",
    details:
      "Large Language Models learn statistical patterns from text and other training data. Explore tokens, context windows, prompting, training, inference, and limitations.",
  },
  {
    title: "AGI",
    description: "Understand the idea of Artificial General Intelligence.",
    icon: "🌐",
    screen: "agi",
    details:
      "Artificial General Intelligence is a proposed form of AI with broad abilities across many different tasks. Definitions and expectations vary, and there is no universally accepted test for AGI.",
  },
  {
    title: "ASI",
    description: "Explore the hypothetical idea of superintelligent AI.",
    icon: "🚀",
    screen: "asi",
    details:
      "Artificial Superintelligence refers to a hypothetical AI that surpasses human capabilities across a wide range of important intellectual tasks. It remains a speculative concept.",
  },
  {
    title: "Machine Learning",
    description: "Learn how models find patterns in data.",
    icon: "📊",
    screen: "machine-learning",
    details:
      "Machine Learning uses data to train models for predictions, classification, clustering, and other tasks. Explore supervised learning, unsupervised learning, and reinforcement learning.",
  },
  {
    title: "AIOps",
    description: "AI for IT operations, monitoring, and incident analysis.",
    icon: "☁️",
    screen: "aiops",
    details:
      "AIOps applies analytics and AI techniques to operational data such as logs, metrics, and traces. Common uses include anomaly detection, event correlation, and incident investigation.",
  },
  {
    title: "Generative AI",
    description: "AI that creates text, images, code, and other content.",
    icon: "✨",
    screen: "generative-ai",
    details:
      "Generative AI systems create new content based on learned patterns. Explore language models, image generation, multimodal systems, evaluation, and responsible use.",
  },
];

export default function AIPage({
  topicKey,
  onBack,
  onOpenTopic,
  onBackToAI,
}) {
  const selectedTopic = aiTopics.find((topic) => topic.screen === topicKey);

  if (topicKey) {
    return (
      <section className="tc-ai-page">
        <button className="tc-back-link" onClick={onBackToAI} type="button">
          ← Back to Artificial Intelligence
        </button>

        {selectedTopic ? (
          <article className="tc-ai-detail">
            <span className="tc-ai-detail-icon" aria-hidden="true">
              {selectedTopic.icon}
            </span>

            <p className="tc-eyebrow">ARTIFICIAL INTELLIGENCE</p>
            <h1>{selectedTopic.title}</h1>
            <p className="tc-ai-detail-description">
              {selectedTopic.description}
            </p>

            <div className="tc-ai-detail-content">
              <h2>Overview</h2>
              <p>{selectedTopic.details}</p>
              <p>
                This is the starting point for this topic. We can expand this
                page with structured lessons, real-world examples, articles,
                diagrams, and related updates.
              </p>
            </div>
          </article>
        ) : (
          <div className="tc-ai-detail">
            <h1>Topic not found</h1>
            <p>Please select a topic from the AI page.</p>
            <button
              className="tc-button tc-button-primary"
              onClick={onBackToAI}
              type="button"
            >
              View AI topics
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="tc-ai-page">
      <button className="tc-back-link" onClick={onBack} type="button">
        ← Back to Explore
      </button>

      <header className="tc-ai-heading">
        <p className="tc-eyebrow">EXPLORE THE FUTURE</p>
        <h1>Artificial Intelligence</h1>
        <p>
          From AI Agents and Agentic AI to RAG, LLMs, AGI, and beyond,
          explore the ideas and technologies shaping artificial intelligence.
        </p>
      </header>

      <div className="tc-ai-topic-grid">
        {aiTopics.map((topic) => (
          <button
            className="tc-ai-topic-card"
            key={topic.screen}
            type="button"
            onClick={() => onOpenTopic(topic)}
          >
            <span className="tc-ai-topic-icon" aria-hidden="true">
              {topic.icon}
            </span>

            <span className="tc-ai-topic-content">
              <strong>{topic.title}</strong>
              <span>{topic.description}</span>
            </span>

            <span className="tc-ai-topic-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

