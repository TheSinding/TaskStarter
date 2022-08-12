import { QuickPick, QuickPickItem, window } from 'vscode'

type QuickPickWithoutFunctions<T extends QuickPickItem> = Omit<QuickPick<T>, 'dispose' | 'show' | 'hide'>

export const createQuickPickHelper = <T extends QuickPickItem>(
  options?: Partial<QuickPickWithoutFunctions<T>>
): QuickPick<T> => {
  const picker = window.createQuickPick<T>()
  if (options) {
    Object.entries(options).forEach(([key, value]: [string, any]) => ((picker as any)[key] = value))
  }
  return picker
}
