export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  publishedDate?: string;
  author?: string;
  thumbnail?: string;
  imgSrc?: string;
  category?: string;
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

export type UnresponsiveEngine = [engine: string, reason: string];

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  suggestions: string[];
  corrections: string[];
  infobox?: Infobox;
  unresponsiveEngines: UnresponsiveEngine[];
}
