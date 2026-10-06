export const phosphors = ["white", "green", "amber"] as const;
export type Phosphor = (typeof phosphors)[number];

export const effectsKey = "puma-effects";
export const phosphorKey = "puma-phosphor";
export const lensKey = "puma-lens";

/**
 * Runs before the first paint (see the layout), so a visitor who turned the
 * effects off never sees them flash on.
 */
export const preferencesScript = `try{var d=document.documentElement,s=localStorage;d.dataset.effects=s.getItem("${effectsKey}")==="off"?"off":"on";var p=s.getItem("${phosphorKey}");d.dataset.phosphor=${JSON.stringify(phosphors)}.indexOf(p)>-1?p:"white"}catch(e){}`;
