export interface RefinedBullet {
  original: string;
  refined: string;
}

export async function refineBullet(
  bullet: string,
  _keywords: string[]
): Promise<RefinedBullet> {
  return { original: bullet, refined: bullet };
}
