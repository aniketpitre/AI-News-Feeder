export interface MockArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  content: string;
  topics: string[];
  url: string;
  imageUrl?: string;
}

export const mockArticles: MockArticle[] = [
  {
    id: "art-1",
    title: "Kubernetes 1.32: Advancing Edge Workloads & API Maturity",
    category: "K8s",
    date: "June 2026",
    summary: "Exploring the latest updates in Kubernetes 1.32, showcasing core optimizations for low-power edge systems, device plugins, and graduating sidecar container APIs.",
    content: "Kubernetes 1.32 marks a significant milestone in supporting distributed computing workloads. This release stabilizes the Sidecar Containers feature, improving startup and shutdown ordering for multi-container pods. Key updates also optimize kubelet resource footprint, enabling seamless execution on resource-constrained Edge IoT devices. Furthermore, the NetworkPolicy status API is promoted to beta, allowing developers to debug ingress/egress filtering rules with clear CLI diagnostics.",
    topics: ["Kubernetes", "Edge Computing", "API Development"],
    url: "https://kubernetes.io/blog/"
  },
  {
    id: "art-2",
    title: "Gemini 3.5: Revolutionizing Multi-Modal Reasoning in DevOps Agents",
    category: "AI/ML",
    date: "May 2026",
    summary: "How Gemini 3.5's massive context window enables autonomous coding agents to refactor systems and debug CI/CD pipelines in real time.",
    content: "With the debut of Gemini 3.5, autonomous agents are transitioning from basic code completion to comprehensive systems engineering. Leveraging a 2-million token context window, dev agents can parse entire legacy codebases alongside live Kubernetes event streams. Teams deploying these models report a 40% reduction in debugging times for complex CI/CD pipeline failures, as the AI contextually traces failure logs back to the specific config parameters or source code lines.",
    topics: ["Gemini AI", "LLMs", "DevOps Automation"],
    url: "https://deepmind.google/technologies/gemini/"
  },
  {
    id: "art-3",
    title: "Zero Trust Mesh: Securing Multi-Cloud EKS Workloads",
    category: "Cyber SOC",
    date: "April 2026",
    summary: "Implementing a strict cryptographic identity validation model across disparate AWS and GCP Kubernetes deployments using SPIFFE/SPIRE.",
    content: "Securing microservices operating across multi-cloud environments requires moving beyond basic network security perimeters. Implementing a Zero Trust Mesh via SPIFFE/SPIRE allows each container pod to obtain short-lived, cryptographically verifiable identities. In this article, we walk through configuring service-to-service mTLS across Amazon EKS and Google GKE clusters without exposing static cloud access tokens, minimizing credential harvesting risks.",
    topics: ["Cybersecurity", "Zero Trust", "Service Mesh"],
    url: "https://spiffe.io/"
  },
  {
    id: "art-4",
    title: "Infrastructure as Code: Next-Gen Rollouts with OpenTofu",
    category: "DevOps",
    date: "March 2026",
    summary: "Analyzing declarative state drift management and policy-as-code gates using OpenTofu 1.9 for GitOps orchestration.",
    content: "OpenTofu 1.9 introduces advanced capabilities for preventing configuration drift inside GitOps pipelines. By utilizing policy-as-code checkers like OPA (Open Policy Agent) at the plan stage, operations teams can enforce security rules before infrastructure modifications are committed. This tutorial covers configuring auto-remediation scripts that trigger when live cloud resources drift from their declared Terraform/OpenTofu state configurations.",
    topics: ["IaC", "OpenTofu", "GitOps"],
    url: "https://opentofu.org/"
  },
  {
    id: "art-5",
    title: "AI-Powered Threat Modeling inside SOC Dashboards",
    category: "Cyber SOC",
    date: "February 2026",
    summary: "Leveraging real-time stream analysis and LLMs to flag anomaly patterns in cloud trail logs and automate incident isolation.",
    content: "As cyber threats grow in speed and complexity, SOC operators are utilizing real-time LLM reasoning to filter security alerts. By piping AWS CloudTrail and Linux audit logs into an anomaly detector, security frameworks can dynamically isolate compromised containers. The AI system drafts high-level security briefs detailing the attack vector and executes automatic network policy updates to quarantine the affected resources.",
    topics: ["Cyber Security", "AI SOC", "Incident Response"],
    url: "https://aws.amazon.com/security/"
  },
  {
    id: "art-6",
    title: "Optimizing Next.js Standalone Docker Builds for Cloud Deployment",
    category: "DevOps",
    date: "January 2026",
    summary: "How multi-stage builds and standalone configuration outputs reduce image sizes from 1.2GB to under 120MB.",
    content: "Next.js applications can be heavy when packaged with full node_modules folder trees. By configuring output: 'standalone' in next.config.ts, the compiler outputs a minimal server module containing only the required code. Copying this module alongside static assets into a multi-stage Docker template generates lightweight production containers. This cuts deployment rollout startup times and reduces AWS registry storage fees significantly.",
    topics: ["Docker", "Next.js", "Performance Optimization"],
    url: "https://nextjs.org/docs/app/api-reference/next-config-js/output"
  }
];
