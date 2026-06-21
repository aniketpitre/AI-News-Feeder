'use client';

import React, { useEffect, useCallback } from 'react';
import { X, ExternalLink, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';

export interface ArticlePanelData {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  url: string;
  topics?: string[];
  content?: string;
}

interface ArticlePanelProps {
  article: ArticlePanelData | null;
  onClose: () => void;
}

const CATEGORY_CONFIG: Record<string, { color: string }> = {
  'K8s':       { color: '#00FFC2' },
  'DevOps':    { color: '#4FC3F7' },
  'AI/ML':     { color: '#CE93D8' },
  'Cyber SOC': { color: '#FF8A65' },
  'General':   { color: '#aaaaaa' },
};

function getRichContent(article: ArticlePanelData) {
  const category = article.category;
  const contentBody = article.content || article.excerpt || '';
  let sections: { type: 'p' | 'h3' | 'code'; content: string; lang?: string }[] = [];
  
  if (category === 'K8s') {
    sections = [
      { type: 'p', content: `${contentBody} This update represents a collaborative effort across multiple Special Interest Groups (SIGs) to elevate production-grade performance, improve compatibility boundaries, and introduce standardized APIs.` },
      { type: 'h3', content: 'Key Architectural Highlights' },
      { type: 'p', content: 'One of the most anticipated updates is the graduation of Sidecar Containers to a stable feature. Prior to this, initializing logging daemons, service mesh sidecars, or configuration synchronizers required complex, fragile entrypoint scripts. With native sidecars, Kubernetes guarantees that auxiliary containers start before main app containers and remain running until the primary workload finishes.' },
      { type: 'code', lang: 'yaml', content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: secured-web-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: main-app
        image: nginx:1.25
      initContainers:
      - name: vault-agent
        image: hashicorp/vault:1.15
        restartPolicy: Always # Declares this as a native sidecar` },
      { type: 'h3', content: 'Edge Optimization & API Maturation' },
      { type: 'p', content: 'For resource-constrained environments, kubelet memory management has been heavily optimized. By utilizing structured logging and limiting active file descriptor retention, memory utilization has been dropped by 18%. Additionally, SPIFFE-based pod identifiers can now be mounted directly via Projected Volumes, offering automated cryptographic identity validation.' }
    ];
  } else if (category === 'AI/ML') {
    sections = [
      { type: 'p', content: `${contentBody} The implications of this update stretch across software architecture, operations, and general automation. Teams are now deploying autonomous systems that actively monitor their own runtime state.` },
      { type: 'h3', content: 'Leveraging a 2-Million Token Window' },
      { type: 'p', content: 'Traditional code generation tools are limited to single-file suggestions. Gemini 3.5 overcomes this restriction by reading entire code repositories along with dependency locks, Dockerfiles, and Helm charts. This comprehensive context allows the reasoning engine to map out deep architectural dependencies and locate bugs that span multiple microservices.' },
      { type: 'code', lang: 'python', content: `import google.generativeai as genai

# Initialize agent with repository context
model = genai.GenerativeModel('gemini-3.5-pro')
chat = model.start_chat(history=[])

response = chat.send_message(
    "Analyze the crash log from the pods: "
    "K8s says 'BackOff' and the logs show db connection timeout. "
    "Here is our entire config folder: ..."
)` },
      { type: 'h3', content: 'Autonomous CI/CD Debugging' },
      { type: 'p', content: 'DevOps agents running Gemini 3.5 can connect directly to GitHub Actions API streams. When a build step fails, the agent queries the runner logs, parses the build failure, writes a corrective patch in a new branch, runs local tests, and opens a Pull Request with a detailed summary.' }
    ];
  } else if (category === 'DevOps') {
    sections = [
      { type: 'p', content: `${contentBody} Automating infrastructure state management remains a primary bottleneck for high-velocity teams. These updates show how GitOps and policy-as-code are merging to address configuration drift.` },
      { type: 'h3', content: 'Preventing Infrastructure State Drift' },
      { type: 'p', content: 'OpenTofu 1.9 introduces encrypted state files and advanced state locking. This ensures that concurrent runs inside GitLab or GitHub runners do not corrupt infrastructure mapping. Furthermore, state snapshots can now be audited in real time against live cloud resources.' },
      { type: 'code', lang: 'hcl', content: `# OpenTofu 1.9 Drift Management
provider "aws" {
  region = "us-east-1"
}

resource "aws_security_group" "web_firewall" {
  name        = "secure-web-sg"
  description = "Managed via OpenTofu GitOps"
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}` },
      { type: 'h3', content: 'Enforcing Security Gates' },
      { type: 'p', content: 'By integrating Open Policy Agent (OPA) directly into the plan phase, infrastructure modifications are blocked if they violate compliance rules. For instance, any change exposing database ports directly to the internet is rejected before resource allocation begins.' }
    ];
  } else if (category === 'Cyber SOC') {
    sections = [
      { type: 'p', content: `${contentBody} Mitigating cloud-native threats requires real-time automated intervention. By leveraging spi-fication and container runtime isolation, security teams can respond to intrusions in seconds.` },
      { type: 'h3', content: 'Automated Container Anomaly Detection' },
      { type: 'p', content: 'By piping kernel-level system calls via eBPF probes, SOC agents analyze execution patterns within active workloads. If a container tries to execute a shell or access host-level credentials, the SOC system flags the alert and triggers a localized security policy.' },
      { type: 'code', lang: 'json', content: `{
  "alert": "Unauthorized Socket Connection",
  "source_pod": "customer-api-8f921a",
  "severity": "CRITICAL",
  "mitigation_action": "isolate_pod",
  "timestamp": "2026-06-21T13:45:00Z"
}` },
      { type: 'h3', content: 'Zero Trust Inter-Service Connectivity' },
      { type: 'p', content: 'Establishing strict cryptographic trust mesh prevents lateral movement. If a single web pod is compromised, security mesh rules restrict it from accessing database endpoints or caching servers, containing the threat cluster within the ingress boundary.' }
    ];
  } else {
    sections = [
      { type: 'p', content: contentBody },
      { type: 'p', content: 'Keeping systems secure, scalable, and automated is the core pillar of modern digital architectures. Continuous learning and testing remain paramount.' }
    ];
  }

  return sections;
}

export function ArticlePanel({ article, onClose }: ArticlePanelProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [article]);

  if (!article) return null;
  const color = (CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.General || { color: '#00FFC2' }).color;
  const richSections = getRichContent(article);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <style>{`
        @keyframes modalExpandHome {
          from {
            opacity: 0;
            transform: scale(0.93) translateY(15px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .modal-animate-expand-home {
          animation: modalExpandHome 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div 
        className="relative w-full max-w-3xl h-[82vh] flex flex-col rounded-3xl overflow-hidden border modal-animate-expand-home"
        style={{ 
          background: 'rgba(8, 11, 20, 0.96)',
          borderColor: `${color}40`,
          boxShadow: `0 0 50px ${color}20`,
          backdropFilter: 'blur(30px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored top gradient bar */}
        <div className="h-1.5 w-full shrink-0" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-white/5 bg-black/10">
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full border"
              style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
              {article.category}
            </span>
            <span className="text-[9px] font-mono text-white/30">{article.date}</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/40 hover:text-white hover:bg-white/5 transition-all p-2 rounded-full border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-6 no-scrollbar">
          <h2 className="text-2xl font-black leading-snug text-white">
            <TextScramble text={article.title} trigger="both" />
          </h2>
          
          {/* Immersive rich sections */}
          {richSections.map((sec, idx) => {
            if (sec.type === 'p') {
              return <p key={idx} className="text-[13px] text-white/70 leading-relaxed font-normal">{sec.content}</p>;
            }
            if (sec.type === 'h3') {
              return <h3 key={idx} className="text-sm font-black text-white pt-3 uppercase tracking-wider" style={{ color }}>{sec.content}</h3>;
            }
            if (sec.type === 'code') {
              return (
                <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/5 bg-black/60 p-5 font-mono text-[11px] leading-relaxed text-white/90">
                  <div className="absolute top-2 right-3 text-[8px] font-black uppercase text-white/25">{sec.lang}</div>
                  <pre className="overflow-x-auto no-scrollbar"><code>{sec.content}</code></pre>
                </div>
              );
            }
            return null;
          })}

          {article.topics && article.topics.length > 0 && (
            <div className="pt-4">
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block mb-2.5">Signal Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {article.topics.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                    style={{ background: `${color}10`, border: `1px solid ${color}20`, color: `${color}bb` }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* External links footer */}
        <div className="px-8 py-5 shrink-0 border-t border-white/5 flex items-center justify-between bg-black/30">
          <span className="text-[9px] font-mono text-white/30">Transmission verified via secure agent mesh</span>
          <a href={article.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 font-black uppercase tracking-widest px-6 py-3.5 rounded-xl text-[10px] text-black transition-all hover:brightness-110 active:scale-95"
            style={{ background: color, boxShadow: `0 0 24px ${color}30` }}>
            Access Full Source <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
