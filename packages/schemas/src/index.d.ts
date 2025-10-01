import schema from './model.schema.json';
export * from './types.js';
export declare const modelSchema: {
  $schema: string;
  $id: string;
  title: string;
  type: string;
  additionalProperties: boolean;
  required: string[];
  properties: {
    version: {
      const: string;
    };
    routes: {
      type: string;
      items: {
        $ref: string;
      };
    };
    nodes: {
      type: string;
      patternProperties: {
        '^.+$': {
          $ref: string;
        };
      };
      additionalProperties: boolean;
    };
    build: {
      $ref: string;
    };
    flight: {
      $ref: string;
    };
  };
  definitions: {
    NodeKind: {
      enum: string[];
    };
    Diagnostic: {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: {
        rule: {
          type: string;
          minLength: number;
        };
        level: {
          enum: string[];
        };
        message: {
          type: string;
          minLength: number;
        };
        loc: {
          type: string;
          required: string[];
          additionalProperties: boolean;
          properties: {
            file: {
              type: string;
              minLength: number;
            };
            line: {
              type: string;
              minimum: number;
            };
            col: {
              type: string;
              minimum: number;
            };
          };
        };
      };
    };
    XNode: {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: {
        id: {
          type: string;
          minLength: number;
        };
        file: {
          type: string;
        };
        name: {
          type: string;
        };
        kind: {
          $ref: string;
        };
        bytes: {
          type: string;
          minimum: number;
        };
        hydrationMs: {
          type: string;
          minimum: number;
        };
        diagnostics: {
          type: string;
          items: {
            $ref: string;
          };
        };
        suggestions: {
          type: string;
          items: {
            $ref: string;
          };
        };
        children: {
          type: string;
          items: {
            type: string;
            minLength: number;
          };
        };
        tags: {
          type: string;
          items: {
            type: string;
            minLength: number;
          };
        };
        cache: {
          $ref: string;
        };
        mutations: {
          $ref: string;
        };
      };
    };
    RouteEntry: {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: {
        route: {
          type: string;
          minLength: number;
        };
        rootNodeId: {
          type: string;
          minLength: number;
        };
        changedAt: {
          type: string;
          format: string;
        };
        chunks: {
          type: string;
          items: {
            type: string;
            minLength: number;
          };
        };
        totalBytes: {
          type: string;
          minimum: number;
        };
        cache: {
          $ref: string;
        };
      };
    };
    BuildInfo: {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: {
        nextVersion: {
          type: string;
          minLength: number;
        };
        timestamp: {
          type: string;
          format: string;
        };
      };
    };
    FlightSample: {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: {
        route: {
          type: string;
          minLength: number;
        };
        ts: {
          type: string;
        };
        chunkIndex: {
          type: string;
          minimum: number;
        };
        label: {
          type: string;
        };
      };
    };
    FlightData: {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: {
        samples: {
          type: string;
          items: {
            $ref: string;
          };
        };
      };
    };
    Suggestion: {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: {
        rule: {
          type: string;
          minLength: number;
        };
        level: {
          enum: string[];
        };
        message: {
          type: string;
          minLength: number;
        };
        loc: {
          type: string;
          required: string[];
          additionalProperties: boolean;
          properties: {
            file: {
              type: string;
              minLength: number;
            };
            line: {
              type: string;
              minimum: number;
            };
            col: {
              type: string;
              minimum: number;
            };
          };
        };
      };
    };
    NodeCacheMetadata: {
      type: string;
      additionalProperties: boolean;
      properties: {
        modes: {
          type: string;
          items: {
            enum: string[];
          };
        };
        revalidateSeconds: {
          type: string;
          items: {
            type: string;
            minimum: number;
          };
        };
        hasRevalidateFalse: {
          type: string;
        };
        dynamic: {
          enum: string[];
        };
        experimentalPpr: {
          type: string;
        };
      };
    };
    NodeMutationMetadata: {
      type: string;
      additionalProperties: boolean;
      properties: {
        tags: {
          type: string;
          items: {
            type: string;
            minLength: number;
          };
        };
        paths: {
          type: string;
          items: {
            type: string;
            minLength: number;
          };
        };
      };
    };
    RouteCacheMetadata: {
      type: string;
      additionalProperties: boolean;
      properties: {
        revalidateSeconds: {
          oneOf: (
            | {
                type: string;
                minimum: number;
                enum?: undefined;
              }
            | {
                type: string;
                enum: boolean[];
                minimum?: undefined;
              }
          )[];
        };
        tags: {
          type: string;
          items: {
            type: string;
            minLength: number;
          };
        };
        dynamic: {
          enum: string[];
        };
        experimentalPpr: {
          type: string;
        };
      };
    };
  };
};
export type ModelSchema = typeof schema;
