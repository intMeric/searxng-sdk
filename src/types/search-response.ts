export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  engines: string[];
  positions: number[];
  score: number;
  publishedDate?: string;
  pubdate?: string;
  author?: string;
  thumbnail?: string;
  imgSrc?: string;
  category?: string;
  metadata?: string;
  template?: string;
  parsedUrl?: string[];
  priority?: string;
}

export interface InfoboxAttribute {
  label: string;
  value: string;
}

export interface InfoboxUrl {
  url: string;
  title: string;
}

export interface InfoboxRelatedTopic {
  name: string;
  suggestions: string[];
}

export interface Infobox {
  title: string;
  imgSrc?: string;
  content?: string;
  attributes: InfoboxAttribute[];
  urls: InfoboxUrl[];
  relatedTopics: InfoboxRelatedTopic[];
}

export interface Answer {
  answer: string;
  url: string;
  engine: string;
  template?: string;
  parsedUrl?: string[];
}

export type UnresponsiveEngine = [engine: string, reason: string];

export interface SearchResponse {
  query: string;
  numberOfResults: number;
  results: SearchResult[];
  answers: Answer[];
  suggestions: string[];
  corrections: string[];
  infobox?: Infobox;
  unresponsiveEngines: UnresponsiveEngine[];
}
