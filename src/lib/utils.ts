export function cn(...inputs: any[]) {
    return inputs.filter(Boolean).map(x => x.trim()).join(' ');
}
