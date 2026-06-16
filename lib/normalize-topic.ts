export function normalizeTopic(topics: string[], feedSource: string): string {
  const all = [...(topics || []), feedSource]
    .filter(Boolean)
    .map(t => t.toLowerCase());

  if (all.some(t =>
    t.includes('kubernetes') || t === 'k8s' || t.includes('k8s') ||
    t.includes('kubectl') || t.includes('helm') || t.includes('cncf') ||
    t.includes('eks') || t.includes('k3s') || t.includes('aks') ||
    t.includes('gke') || t.includes('etcd') || t.includes('kubeweekly')
  )) return 'K8s';

  if (all.some(t =>
    t.includes('devops') || t.includes('ci/cd') || t.includes('cicd') ||
    t.includes('docker') || t.includes('terraform') || t.includes('gitops') ||
    t.includes('ansible') || t.includes('jenkins') || t.includes('argocd') ||
    t.includes('pipeline') || t.includes('sre') || t.includes('site reliability') ||
    t.includes('circleci') || t.includes('github actions') || t.includes('hashicorp') ||
    t.includes('the new stack') || t.includes('devops.com') || t.includes('vault') ||
    t.includes('packer') || t.includes('deployment') || t.includes('infrastructure')
  )) return 'DevOps';

  if (all.some(t =>
    t.includes('cyber') || t.includes('security') || t.includes('soc') ||
    t.includes('malware') || t.includes('cve') || t.includes('hacker') ||
    t.includes('vulnerability') || t.includes('threat') || t.includes('exploit') ||
    t.includes('ransomware') || t.includes('phishing') || t.includes('breach') ||
    t.includes('zero-day') || t.includes('cisa') || t.includes('apt') ||
    t.includes('the hacker news') || t.includes('krebs') || t.includes('bleeping') ||
    t.includes('dark reading') || t.includes('sans') || t.includes('firewall') ||
    t.includes('siem') || t.includes('intrusion') || t.includes('pentest')
  )) return 'Cyber SOC';

  if (all.some(t =>
    t.includes('ai') || t.startsWith('ml') || t.includes(' ml') ||
    t.includes('machine learning') || t.includes('deep learning') ||
    t.includes('llm') || t.includes('large language') || t.includes('neural') ||
    t.includes('gemini') || t.includes('openai') || t.includes('gpt') ||
    t.includes('claude') || t.includes('nlp') || t.includes('generative') ||
    t.includes('hugging face') || t.includes('towards data science') ||
    t.includes('data science') || t.includes('mlops') || t.includes('computer vision') ||
    t.includes('transformer') || t.includes('reinforcement') || t.includes('inference') ||
    t.includes('google ai') || t.includes('pytorch') || t.includes('tensorflow')
  )) return 'AI/ML';

  return feedSource || topics?.[0] || 'General';
}
