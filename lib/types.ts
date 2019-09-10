export interface Project {
  project: {
    id: string;
    name: string;
    type: string;
    platform: string;
    created_at: {
      date: string;
      timezone_type: number;
      timezone: string
    };
    updated_at: {
      date: string;
      timezone_type: number;
      timezone: string;
    }
  };
  board: {
    board: { root_messages: any[], messages: any[] };
    slots: {};
    variables: {}[];
    created_at: {};
    updated_at: {};
  };
  intents: {
    id: string;
    name: string;
    utterances: any[];
    created_at: {};
    updated_at: {};
    is_global: boolean;
  }[];
  entities: any[];
}
