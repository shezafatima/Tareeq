// Splits select options into runs for <optgroup>. Pure, so it can be unit tested.

export type GroupableOption = { value: string; label: string; group?: string };
export type OptionRun<T extends GroupableOption> = { group?: string; options: T[] };

/** Consecutive options with the same group form one run; ungrouped options form bare runs. Input order is kept. */
export function groupOptions<T extends GroupableOption>(options: readonly T[]): OptionRun<T>[] {
  const runs: OptionRun<T>[] = [];
  for (const option of options) {
    const last = runs[runs.length - 1];
    if (last && last.group === option.group) last.options.push(option);
    else runs.push({ ...(option.group !== undefined ? { group: option.group } : {}), options: [option] });
  }
  return runs;
}
