export interface SemanticMatch {
  requirement: string;
  experience_id: string;
  confidence: number;
}

export async function matchRequirements(
  _requirements: string[],
  _experienceText: string
): Promise<SemanticMatch[]> {
  return [];
}
