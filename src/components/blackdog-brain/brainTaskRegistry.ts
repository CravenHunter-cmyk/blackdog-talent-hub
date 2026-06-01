import type { BrainTaskDefinition } from "./brainTaskTypes";

export const brainTaskRegistry: BrainTaskDefinition[] = [
  {
    id: "prompt-rewriting",
    label: "Prompt Rewriting",
    category: "Instruction quality",
    shortDescription: "Rewrite rough task instructions into precise, model-ready prompts with clearer constraints, examples, and evaluation intent.",
    workflowSteps: ["Clarify task intent", "Rewrite constraints", "Add examples", "Check evaluation fit"],
    templateSections: [
      { title: "Input structure", items: ["Original requirement", "Target model behavior", "Quality standard"] },
      { title: "Output package", items: ["Rewritten prompt", "Constraint checklist", "Review notes"] },
    ],
    outputGoal: "A prompt package ready for model evaluation, reviewer execution, and quality control.",
  },
  {
    id: "caption-expansion",
    label: "Caption Expansion",
    category: "Multimodal data",
    shortDescription: "Expand short captions into richer descriptions while preserving visual facts, language style, and annotation boundaries.",
    workflowSteps: ["Read source caption", "Identify visual facts", "Expand safely", "Flag uncertainty"],
    templateSections: [
      { title: "Input structure", items: ["Source caption", "Image or video context", "Expansion style"] },
      { title: "Output package", items: ["Expanded caption", "Fact preservation notes", "Risk flags"] },
    ],
    outputGoal: "Expanded captions that improve data richness without inventing unsupported visual details.",
  },
  {
    id: "video-description",
    label: "Video Description",
    category: "Multimodal data",
    shortDescription: "Convert video observations into structured descriptions for training, search, review, and semantic alignment workflows.",
    workflowSteps: ["Capture scene context", "Segment key moments", "Apply schema", "Review metadata"],
    templateSections: [
      { title: "Input structure", items: ["Video brief", "Scene notes", "Required schema"] },
      { title: "Output package", items: ["Structured description", "Timeline notes", "Metadata suggestions"] },
    ],
    outputGoal: "Structured video descriptions with enough context for downstream review and training workflows.",
  },
  {
    id: "semantic-alignment",
    label: "Image/Video Semantic Alignment",
    category: "Multimodal data",
    shortDescription: "Check whether text, image, and video signals describe the same intent, object, action, and context.",
    workflowSteps: ["Compare modalities", "Identify mismatches", "Classify alignment", "Write reviewer guidance"],
    templateSections: [
      { title: "Input structure", items: ["Visual asset", "Candidate text", "Alignment rules"] },
      { title: "Output package", items: ["Alignment decision", "Mismatch reasons", "Reviewer guidance"] },
    ],
    outputGoal: "A clear alignment decision with traceable reasons and reviewer-ready instructions.",
  },
  {
    id: "multilingual-translation-corpus",
    label: "Multilingual Translation Corpus",
    category: "Language data",
    shortDescription: "Prepare multilingual translation data with language, region, domain, tone, and quality-control requirements.",
    workflowSteps: ["Define language pair", "Set domain rules", "Prepare samples", "Plan QC"],
    templateSections: [
      { title: "Input structure", items: ["Source language", "Target language", "Domain requirements"] },
      { title: "Output package", items: ["Corpus plan", "Translation guidelines", "QC checklist"] },
    ],
    outputGoal: "A translation corpus plan that keeps language, domain, and review standards explicit.",
  },
  {
    id: "parallel-corpus-construction",
    label: "Parallel Corpus Construction",
    category: "Language data",
    shortDescription: "Build aligned source-target text pairs for translation, evaluation, and multilingual model training pipelines.",
    workflowSteps: ["Prepare source texts", "Validate target texts", "Align pairs", "Log issues"],
    templateSections: [
      { title: "Input structure", items: ["Source texts", "Target texts", "Alignment criteria"] },
      { title: "Output package", items: ["Parallel pairs", "Alignment status", "Issue log"] },
    ],
    outputGoal: "Validated source-target pairs that can support multilingual training or evaluation.",
  },
  {
    id: "text-classification",
    label: "Text Classification",
    category: "Annotation",
    shortDescription: "Turn classification requirements into label definitions, edge cases, examples, and reviewer workflows.",
    workflowSteps: ["Define labels", "Map edge cases", "Prepare examples", "Set QA sampling"],
    templateSections: [
      { title: "Input structure", items: ["Text samples", "Label taxonomy", "Business rule"] },
      { title: "Output package", items: ["Label guide", "Decision examples", "QA sampling plan"] },
    ],
    outputGoal: "A classification guideline that supports consistent human annotation and review.",
  },
  {
    id: "entity-annotation",
    label: "Entity Annotation",
    category: "Annotation",
    shortDescription: "Define entity labels, boundaries, examples, and validation rules for structured annotation projects.",
    workflowSteps: ["Define entity schema", "Set boundary rules", "Prepare examples", "Validate consistency"],
    templateSections: [
      { title: "Input structure", items: ["Text samples", "Entity schema", "Boundary rules"] },
      { title: "Output package", items: ["Entity guideline", "Annotation examples", "Validation checklist"] },
    ],
    outputGoal: "An entity annotation package with clear boundaries and validation rules.",
  },
  {
    id: "intent-recognition",
    label: "Intent Recognition",
    category: "Annotation",
    shortDescription: "Design intent labels and conversation examples for support, search, agent, and assistant workflows.",
    workflowSteps: ["Define intent taxonomy", "Map utterances", "Identify confusions", "Create examples"],
    templateSections: [
      { title: "Input structure", items: ["User utterances", "Intent taxonomy", "Domain context"] },
      { title: "Output package", items: ["Intent map", "Example library", "Confusion pairs"] },
    ],
    outputGoal: "An intent recognition guide that reduces ambiguity across reviewer decisions.",
  },
  {
    id: "sentiment-annotation",
    label: "Sentiment Annotation",
    category: "Annotation",
    shortDescription: "Create sentiment guidelines that separate polarity, emotion, tone, sarcasm, and cultural context.",
    workflowSteps: ["Set sentiment scale", "Separate tone signals", "Handle cultural context", "Build calibration set"],
    templateSections: [
      { title: "Input structure", items: ["Text samples", "Sentiment scale", "Locale context"] },
      { title: "Output package", items: ["Sentiment guide", "Tone notes", "Reviewer calibration set"] },
    ],
    outputGoal: "A sentiment annotation package that supports calibrated, locale-aware review.",
  },
  {
    id: "sft-text-data",
    label: "SFT Text Data",
    category: "Model training",
    shortDescription: "Structure supervised fine-tuning examples with prompts, ideal responses, constraints, and quality checks.",
    workflowSteps: ["Define task scenario", "Draft ideal response", "Check constraints", "Prepare rubric"],
    templateSections: [
      { title: "Input structure", items: ["Task scenario", "Response standard", "Safety boundaries"] },
      { title: "Output package", items: ["SFT examples", "Rubric", "Failure mode list"] },
    ],
    outputGoal: "SFT-ready examples with explicit response standards and quality boundaries.",
  },
  {
    id: "rlhf-preference-data",
    label: "RLHF Preference Data",
    category: "Model training",
    shortDescription: "Build preference comparison tasks with clear ranking criteria, reviewer instructions, and audit trails.",
    workflowSteps: ["Prepare candidates", "Define preference criteria", "Capture ranking reasons", "Review consistency"],
    templateSections: [
      { title: "Input structure", items: ["Prompt", "Candidate responses", "Preference criteria"] },
      { title: "Output package", items: ["Preference task", "Ranking rubric", "Reason capture fields"] },
    ],
    outputGoal: "Preference data tasks with transparent criteria and auditable reviewer reasoning.",
  },
  {
    id: "cot-reasoning-data",
    label: "CoT Reasoning Data",
    category: "Model training",
    shortDescription: "Plan reasoning-data workflows with answer validation, step quality, and privacy-safe explanation handling.",
    workflowSteps: ["Validate answer key", "Review reasoning steps", "Check privacy boundaries", "Capture reviewer notes"],
    templateSections: [
      { title: "Input structure", items: ["Problem set", "Answer key", "Reasoning standard"] },
      { title: "Output package", items: ["Reasoning workflow", "Validation checks", "Reviewer notes"] },
    ],
    outputGoal: "Reasoning data workflows with answer validation and reviewer-safe explanation standards.",
  },
];

export function getBrainTaskById(taskId: string) {
  return brainTaskRegistry.find((task) => task.id === taskId) ?? brainTaskRegistry[0];
}
