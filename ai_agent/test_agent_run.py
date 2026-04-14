"""Smoke run: REJECT scenario with mock or live Bedrock (env-driven)."""

from ai_agent.pipeline.agent_orchestrator import AgentOrchestrator

ARN = "REJECT-2026-003"
QUERY = "Why was this loan rejected?"

agent = AgentOrchestrator()
result = agent.analyse_application(arn=ARN, query=QUERY)

print("\n=== RESULT ===")
print("arn:", result.arn)
print("decision:", result.decision)
print("\n--- response_text ---")
print(result.response_text)
print("\n--- tools_called ---")
for t in result.tools_called:
    print(t)
print("\n--- rag_sources ---")
print(result.rag_sources)
