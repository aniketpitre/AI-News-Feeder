// Default RSS feeds configuration
export interface RSSFeedConfig {
  id: string;
  name: string;
  url: string;
  topic: string;
  category: string;
}

export const RSS_FEEDS: RSSFeedConfig[] = [
  {
    id: 'xda-1',
    name: 'XDA Developers',
    url: 'https://www.xda-developers.com/feed/',
    topic: 'Mobile & DevOps',
    category: 'Tech',
  },
  {
    id: 'ars-1',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    topic: 'Technology',
    category: 'Tech',
  },
  {
    id: 'hackernews-1',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/rss',
    topic: 'Startups & AI',
    category: 'Tech',
  },
  {
    id: 'theverge-1',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    topic: 'Technology',
    category: 'Tech',
  },
  {
    id: 'techcrunch-1',
    name: 'TechCrunch',
    url: 'https://feeds.techcrunch.com/techcrunch/',
    topic: 'Startups & AI',
    category: 'Tech',
  },
  {
    id: 'kubernetes-1',
    name: 'Kubernetes Blog',
    url: 'https://kubernetes.io/feed/',
    topic: 'Kubernetes',
    category: 'DevOps',
  },
  {
    id: 'docker-1',
    name: 'Docker Blog',
    url: 'https://www.docker.com/feed/atom/',
    topic: 'DevOps',
    category: 'DevOps',
  },
  {
    id: 'github-1',
    name: 'GitHub Blog',
    url: 'https://github.blog/feed/',
    topic: 'Development',
    category: 'Tech',
  },
  {
    id: 'openai-1',
    name: 'OpenAI Blog',
    url: 'https://openai.com/feed.xml',
    topic: 'AI & LLMs',
    category: 'AI',
  },
  {
    id: 'arxiv-1',
    name: 'arXiv AI',
    url: 'http://arxiv.org/rss/cs.AI/recent',
    topic: 'AI Research',
    category: 'AI',
  },
];
