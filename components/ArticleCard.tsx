'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Calendar, Zap } from 'lucide-react';

interface ArticleCardProps {
  article: {
    title: string;
    url: string;
    summary: string;
    topics: string[];
    sourceName: string;
    publishedAt: number;
  };
  variant?: 'featured' | 'grid' | 'list';
  index?: number;
}

const topicColors: Record<string, string> = {
  'AI': 'bg-blue-500/20 text-blue-300',
  'ML': 'bg-purple-500/20 text-purple-300',
  'LLMs': 'bg-indigo-500/20 text-indigo-300',
  'DevOps': 'bg-cyan-500/20 text-cyan-300',
  'Kubernetes': 'bg-teal-500/20 text-teal-300',
  'Docker': 'bg-blue-500/20 text-blue-300',
  'Cybersecurity': 'bg-red-500/20 text-red-300',
  'SOC': 'bg-red-500/20 text-red-300',
  'Cloud': 'bg-cyan-500/20 text-cyan-300',
  'Infrastructure': 'bg-slate-500/20 text-slate-300',
  'Security': 'bg-red-500/20 text-red-300',
  'Development': 'bg-green-500/20 text-green-300',
};

export function ArticleCard({ article, variant = 'grid', index = 0, onOpen }: ArticleCardProps & { onOpen?: (a: any) => void }) {
  const timeAgo = (publishedAt: number) => {
    const hours = Math.floor((Date.now() - publishedAt) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getTopicColor = (topic: string) => {
    return topicColors[topic] || 'bg-white/10 text-white/70';
  };

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        onClick={() => onOpen?.(article)}
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        className="group relative h-[600px] bg-gradient-to-br from-[#0A1929] via-[#051B28] to-[#0A0E27] rounded-2xl overflow-hidden border border-[#00FFC2]/20 hover:border-[#00FFC2]/60 transition-all duration-500 flex flex-col justify-between p-8 cursor-pointer"
      >
        {/* Background gradient animation */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#00FFC2]/5 to-[#00D9FF]/5 transition-opacity duration-500" />
        
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00FFC2]/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#00D9FF]/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500" />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-block mb-4"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00FFC2] px-3 py-1 border border-[#00FFC2]/50 rounded-full bg-[#00FFC2]/5">
              Featured Story
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight mb-4 text-white"
          >
            {article.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-lg text-white/70 leading-relaxed max-w-xl mb-6"
          >
            {article.summary}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            {article.topics.map((topic) => (
              <span
                key={topic}
                className={`text-[10px] px-2.5 py-1 rounded-full font-mono uppercase tracking-wider ${getTopicColor(topic)}`}
              >
                {topic}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10"
        >
          <div className="space-y-1">
            <p className="text-xs text-white/50 font-mono uppercase">
              {article.sourceName}
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Calendar className="w-3 h-3" />
              {timeAgo(article.publishedAt)}
            </div>
          </div>

          {onOpen ? (
            <div className="w-12 h-12 rounded-full border border-[#00FFC2]/50 flex items-center justify-center hover:bg-[#00FFC2]/10 hover:border-[#00FFC2] transition-all duration-300" aria-hidden>
              <ExternalLink className="w-5 h-5 text-[#00FFC2]" />
            </div>
          ) : (
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="w-12 h-12 rounded-full border border-[#00FFC2]/50 flex items-center justify-center hover:bg-[#00FFC2]/10 hover:border-[#00FFC2] transition-all duration-300 group/arrow"
            >
              <ExternalLink className="w-5 h-5 text-[#00FFC2] group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5 transition-transform" />
            </a>
          )}
        </motion.div>
      </motion.div>
    );
  }

  if (variant === 'list') {
    const Comp: any = onOpen ? motion.div : motion.a;
    const compProps = onOpen
      ? { onClick: () => onOpen?.(article), role: 'button', tabIndex: 0 }
      : { href: article.url, target: '_blank', rel: 'noreferrer' };

    return (
      <Comp
        {...compProps}
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="group relative p-6 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:border-[#00FFC2]/50 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00FFC2] transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-sm text-white/60 line-clamp-2 mb-3">
              {article.summary}
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span className="font-mono uppercase">{article.sourceName}</span>
              <span>•</span>
              <span>{timeAgo(article.publishedAt)}</span>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-[#00FFC2] transition-colors flex-shrink-0 mt-1" />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {article.topics.slice(0, 2).map((topic) => (
            <span
              key={topic}
              className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider ${getTopicColor(topic)}`}
            >
              {topic}
            </span>
          ))}
        </div>
      </Comp>
    );
  }

  const Comp: any = onOpen ? motion.div : motion.a;
  const compProps = onOpen
    ? { onClick: () => onOpen?.(article), role: 'button', tabIndex: 0 }
    : { href: article.url, target: '_blank', rel: 'noreferrer' };

  return (
    <Comp
      {...compProps}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative h-96 bg-gradient-to-br from-[#0A1929] to-[#051B28] rounded-xl overflow-hidden border border-white/10 hover:border-[#00FFC2]/50 transition-all duration-300 p-6 flex flex-col justify-between"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#00FFC2]/5 to-transparent transition-opacity duration-300" />

      <div className="relative z-10 flex-1">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-block mb-3"
        >
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#00FFC2]/70 px-2 py-1 border border-[#00FFC2]/30 rounded bg-[#00FFC2]/5">
            {article.topics[0] || 'Tech'}
          </span>
        </motion.div>

        <h3 className="text-lg font-bold text-white mb-3 line-clamp-3 group-hover:text-[#00FFC2] transition-colors">
          {article.title}
        </h3>

        <p className="text-sm text-white/60 line-clamp-2">
          {article.summary}
        </p>
      </div>

      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="text-xs text-white/40 space-y-1">
          <p className="font-mono uppercase">{article.sourceName}</p>
          <p>{timeAgo(article.publishedAt)}</p>
        </div>
        <Zap className="w-4 h-4 text-[#00FFC2]/50 group-hover:text-[#00FFC2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </Comp>
  );
}
