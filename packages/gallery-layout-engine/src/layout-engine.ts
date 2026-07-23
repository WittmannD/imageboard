import { LayoutContext, type LayoutPreferences } from './context.js';
import type { Layout } from './layout.js';
import type { TemplatePenalty, TemplatePenaltyFn } from './penalty.js';
import type { InputImage, Template } from './templates.js';

export interface LayoutEvaluationResult {
  template: string;
  layout: Layout;
  score: number;
}

export class LayoutEngine {
  private templates: Template[] = [];
  private penalties: TemplatePenalty[] = [];
  private readonly context: LayoutContext;

  constructor(preferences: LayoutPreferences) {
    this.context = LayoutContext.from(preferences);
  }

  registerTemplate(template: Template): this {
    this.templates.push(template);
    return this;
  }

  registerPenalty(penaltyFn: TemplatePenaltyFn, weight: number): this {
    this.penalties.push({
      fn: penaltyFn,
      weight,
    });
    return this;
  }

  evaluate(images: InputImage[]): LayoutEvaluationResult {
    let best: LayoutEvaluationResult | null = null;

    for (const template of this.templates) {
      if (images.length < template.minImages) {
        continue;
      }

      const layout = template.solve(images, this.context);

      if (!layout) {
        continue;
      }

      console.log(`\ntemplate: ${template.name}`);
      const score = this.score(layout);

      if (best === null || score > best.score) {
        best = { template: template.name, layout, score };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return best!;
  }

  private score(layout: Layout) {
    let score = 1000;

    for (const penalty of this.penalties) {
      const penaltyValue = penalty.fn(layout, this.context) * penalty.weight;
      score += penaltyValue;
      console.log(penalty.fn.name, penaltyValue, '| score:', score);
    }

    return score;
  }
}
