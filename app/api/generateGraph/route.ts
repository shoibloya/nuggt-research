import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key in environment variables
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    const areas = `Extensive List of Distinct Areas:

    Historical Perspective
    
    Explore the origin and evolution of the topic over time.
    Technological Impact
    
    Investigate how technology influences or is influenced by the topic.
    Ethical Considerations
    
    Examine the moral principles and ethical debates surrounding the topic.
    Societal Impact
    
    Analyze how the topic affects society and social dynamics.
    Economic Factors
    
    Assess the economic implications, including costs, benefits, and market effects.
    Legal and Regulatory Issues
    
    Explore laws, regulations, and legal challenges related to the topic.
    Environmental Impact
    
    Investigate the effects on the environment and ecological systems.
    Cultural Significance
    
    Examine the topic's influence on culture, traditions, and cultural expressions.
    Psychological Aspects
    
    Analyze psychological factors and human behavior related to the topic.
    Health and Wellness Implications
    
    Explore the impact on physical and mental health.
    Educational Applications
    
    Investigate how the topic is taught, learned, and applied in educational settings.
    Future Trends and Predictions
    
    Assess potential future developments and forecasts.
    Case Studies and Examples
    
    Analyze specific instances to illustrate practical applications.
    Best Practices and Methodologies
    
    Identify the most effective approaches and methods.
    Challenges and Solutions
    
    Examine the problems faced and potential solutions.
    Innovations and Advancements
    
    Explore recent developments and breakthroughs.
    Global Perspectives
    
    Analyze the topic from international or multicultural viewpoints.
    Statistical Analysis and Data
    
    Use quantitative data to understand trends and patterns.
    Philosophical Underpinnings
    
    Examine fundamental theories and philosophies related to the topic.
    Policy Implications
    
    Assess how the topic influences or is influenced by public policy.
    Industry Applications
    
    Explore how different industries apply or are affected by the topic.
    Cross-Disciplinary Connections
    
    Investigate links between the topic and other fields of study.
    User Experience and Human Factors
    
    Analyze interactions between humans and the topic.
    Security and Privacy Concerns
    
    Explore risks related to security and privacy.
    Design Principles
    
    Examine design aspects, aesthetics, and functionality.
    Theoretical Frameworks
    
    Explore theories and models that explain the topic.
    Practical Implementations
    
    Investigate real-world applications and practices.
    Research Methodologies
    
    Examine methods used to study and analyze the topic.
    Stakeholder Analysis
    
    Identify and assess the interests of different stakeholders.
    Success Metrics and Evaluation
    
    Determine how success is measured and evaluated.
    Failure Analysis
    
    Study failures to understand pitfalls and lessons learned.
    Marketing and Communication Strategies
    
    Explore how the topic is promoted or communicated.
    Competitor Analysis
    
    Assess competitive landscapes related to the topic.
    Consumer Behavior
    
    Analyze how consumers interact with or are affected by the topic.
    Resource Management
    
    Explore how resources are allocated and managed.
    Risk Assessment and Management
    
    Identify risks and strategies to mitigate them.
    Quality Assurance and Control
    
    Examine processes to maintain standards and quality.
    Scalability and Growth
    
    Assess potential for expansion and scalability.
    Accessibility and Inclusivity
    
    Investigate how accessible and inclusive the topic is.
    Collaboration and Partnerships
    
    Explore opportunities for collaboration and alliances.
    Change Management
    
    Examine how changes are implemented and managed.
    Cultural Adaptation
    
    Assess how the topic adapts across different cultures.
    Professional Development
    
    Explore opportunities for learning and career advancement.
    Ethical Dilemmas and Controversies
    
    Examine contentious issues and moral conflicts.
    Legal Precedents and Case Law
    
    Study legal cases that have shaped the topic.
    Behavioral Economics
    
    Analyze economic decisions influenced by human behavior.
    Innovation Diffusion
    
    Explore how innovations spread within markets or societies.
    Network Effects
    
    Assess how the value increases as more people use the topic.
    Social Media Influence
    
    Examine the role of social media in shaping perceptions.
    Disruption Potential
    
    Assess how the topic could disrupt existing systems or industries.
    Privacy Issues
    
    Investigate concerns related to data and personal privacy.
    Automation and AI Impact
    
    Explore effects of automation and artificial intelligence.
    Sustainability Practices
    
    Examine sustainable approaches and environmental stewardship.
    Supply Chain and Logistics
    
    Analyze operational aspects related to supply chains.
    Financial Modeling and Investment
    
    Explore financial aspects and investment opportunities.
    Demographic Trends
    
    Investigate how population dynamics affect the topic.
    Urban Planning and Development
    
    Explore implications for urban environments.
    Education and Training Needs
    
    Assess educational requirements and skill development.
    Regulatory Compliance
    
    Examine adherence to laws and regulations.
    Organizational Behavior and Leadership
    
    Analyze how organizations interact with the topic.
    Team Dynamics and Collaboration
    
    Explore teamwork and collaborative aspects.
    Conflict Resolution
    
    Examine strategies for managing and resolving conflicts.
    Decision-Making Processes
    
    Analyze how decisions are made within the context of the topic.
    Cognitive Biases
    
    Investigate biases that may influence understanding or decisions.
    Motivation and Engagement
    
    Explore factors that drive participation and interest.
    Corporate Social Responsibility
    
    Assess ethical responsibilities and societal contributions.
    Brand Identity and Reputation
    
    Examine impact on branding and public image.
    Data Analytics and Big Data
    
    Explore data-driven insights and analytics.
    Cybersecurity Threats
    
    Investigate security risks and protective measures.
    Disaster Recovery and Business Continuity
    
    Assess preparedness for disruptions and emergencies.
    Cloud Computing and Virtualization
    
    Explore infrastructure and technology solutions.
    Internet of Things (IoT) Integration
    
    Examine connectivity and smart technology applications.
    Human-Computer Interaction
    
    Analyze interfaces between humans and technology.
    Augmented and Virtual Reality Applications
    
    Explore immersive technologies and their uses.
    User Interface and Experience Design
    
    Examine design considerations for usability.
    Sustainable Design and Architecture
    
    Investigate environmentally friendly design practices.
    Customer Satisfaction and Feedback
    
    Assess customer experiences and feedback mechanisms.
    Innovation Ecosystems
    
    Explore environments that foster creativity and innovation.
    Intellectual Property Issues
    
    Examine rights, protections, and legal considerations.
    Remote Work Trends
    
    Analyze implications of remote and flexible work arrangements.
    Work-Life Balance
    
    Explore the topic's impact on personal and professional life.
    Organizational Culture
    
    Examine values, beliefs, and behaviors within organizations.
    Leadership Styles
    
    Analyze different approaches to leadership.
    Employee Engagement
    
    Assess strategies to motivate and involve employees.
    Training and Development Programs
    
    Explore professional growth and skill enhancement opportunities.
    Diversity and Inclusion
    
    Examine efforts to promote equality and diversity.
    Emotional Intelligence
    
    Analyze the role of emotions in interactions related to the topic.
    Corporate Governance
    
    Examine structures and policies for organizational oversight.
    Globalization Effects
    
    Explore international influences and global integration.
    Monetary Policy and Economic Theories
    
    Assess economic principles relevant to the topic.
    Environmental Policies and Regulations
    
    Examine laws aimed at protecting the environment.
    Crisis Management
    
    Investigate strategies for handling crises and emergencies.
    Social Movements and Activism
    
    Explore grassroots efforts and advocacy related to the topic.
    Media and Communication Channels
    
    Analyze how information is disseminated and consumed.
    Cognitive Science and Neuroscience
    
    Examine mental processes and brain functions.
    Behavioral Psychology
    
    Analyze behavior patterns and psychological influences.
    Ethical Marketing
    
    Explore marketing practices that adhere to ethical standards.
    Data Privacy Regulations
    
    Examine legal requirements for protecting personal data.
    Future of Work
    
    Assess emerging trends affecting employment and careers.
    Educational Technology - Explore technological tools used in education.    
    `

    // Define the prompt for ChatGPT, including instructions to output JSON
    const prompt = `
      You are an expert in researching a topic from various angles using google. When presented with a query,
      provide a research plan. Please ensure that every google search covers a topic that is different
      from other google searches in order to avoid redundant and repetitive information. For any given query,
      provide a list of google searches from varying areas and perspectives such that a large breadth of information
      is retrieved related to that query in a manner that avoids redundant and repetitive information. Please choose 5 areas
      from the following list of possible areas for your research:\n\n${areas}\n\n

      Please provide a JSON response in the following format without any additional text:
      {
        "areas": [
          {
            "name": "<Area 1 Name>",
            "reason": "<Reason for choosing this area>",
            "google_search_ideas": [
              "<Search Query 1 for this area>",
              "<Search Query 2 for this area>",
              "<Search Query 3 for this area>"
            ]
          }
          // Remaining 4 areas
        ]
      }
      
      As you generate the queries, please keep the following characteristics of a good google query in mind:

      1. Specific: It includes precise keywords related to the topic. Avoid general or vague terms. Example: Instead of "climate change," search for "effects of climate change on Arctic wildlife."
      2. Concise: It avoids unnecessary words or phrases. Keep the query short and focused. Example: Use "best laptops for programming" instead of "what are the best laptops for programming in 2024?"
      3. Descriptive: It uses words that describe the content you want, such as "tutorial," "definition," "examples," "statistics," or "benefits." Example: "machine learning tutorial for beginners."
      4. Keyword-Rich: Includes primary and secondary keywords relevant to the search. Example: "renewable energy advantages and disadvantages."
      5. Logical Operators (if needed): Uses quotes, plus, minus, or logical operators (AND, OR) to refine results. Example: "data science" AND "job trends" 2024.
      6. Use of Natural Language: When appropriate, phrased as a question or in natural language. Example: "How does photosynthesis work?"
      7. Exclusion of Irrelevant Terms: Uses a minus sign (-) to exclude unwanted topics. Example: "python programming -snake."
      8. Use of Filters (if applicable): Adds time, location, or file type for precision. Example: "climate change report filetype:pdf."
      
      Please only reply in the given JSON format and with nothing else.
      "${query}"
    `;

    const completion = await openai.chat.completions.create({
      model: "o1-mini",
      temperature: 1,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0].message.content;
    const cleanResponse = responseText.replace("\`\`\`json", "").replace("\`\`\`", "")
    console.log(cleanResponse)
    
    // Parse the responseText to JSON
    const data = JSON.parse(cleanResponse);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in generateGraph API route:", error);
    return NextResponse.json(
      { error: "Failed to generate graph data" },
      { status: 500 }
    );
  }
}
