const genesis = require('./services/ai/genesis');
require('dotenv').config();

async function testSurveyGeneration() {
    console.log("🧪 Testing Genesis Survey Generation (GPT-4o)...\n");

    const contextSummary = {
        companyName: "ZenBrew",
        industry: "Direct-to-Consumer Coffee",
        valueProposition: "Nootropic-infused organic coffee for sustained focus without the jitters.",
        targetAudience: ["Remote Software Engineers", "Creative Freelancers", "Biohackers"],
        goals: ["Validate pricing power", "Determine preferred flavor profiles", "Test willingness to subscribe"]
    };

    const strategy = {
        objectives: ["Confirm if users will pay $30/bag", "Identify top 3 desired cognitive benefits"],
        hypotheses: ["Engineers care more about focus than taste", "Subscription fatigue is a major barrier"],
        targetDemographics: ["Tech workers aged 25-40"],
        keyMetrics: ["Willingness to Pay (WTP)", "Churn Risk Factors"]
    };

    try {
        console.log("📝 Generating Survey for:", contextSummary.companyName);
        const startTime = Date.now();

        const survey = await genesis.generateSurvey(contextSummary, strategy);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Generated in ${duration.toFixed(2)}s\n`);

        console.log("--- SURVEY OUTPUT ---");
        console.log("Title:", survey.title);
        console.log("Description:", survey.description);
        console.log("\nQuestions:");
        Object.entries(survey.questions).forEach(([key, q]) => {
            console.log(`\n[${key}] ${q.question} (${q.type})`);
            if (q.options) console.log(`   Options: ${q.options.join(', ')}`);
            if (q.branches) console.log(`   ↳ Branching: ${JSON.stringify(q.branches)}`);
        });

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testSurveyGeneration();
