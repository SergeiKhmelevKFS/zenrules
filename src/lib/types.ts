export interface RuleInput {
  name: string;
  type: string;
}

export interface RuleOutput {
  name: string;
  type: string;
}

export interface RuleCondition {
  input: string;
  operator: string;
  value: string | number | boolean;
}

export interface RuleAction {
  output: string;
  value: any;
}

export interface RuleClause {
  description?: string;
  when: RuleCondition[];
  then: RuleAction[];
}

export interface Rule {
  name: string;
  description: string;
  inputs: RuleInput[];
  outputs: RuleOutput[];
  rules: RuleClause[];
  hitPolicy: 'first' | 'all';
}
