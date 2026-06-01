export type BrainTaskTemplateSection = {
  title: string;
  items: string[];
};

export type BrainTaskDefinition = {
  id: string;
  label: string;
  category: string;
  shortDescription: string;
  workflowSteps: string[];
  templateSections: BrainTaskTemplateSection[];
  outputGoal: string;
};
