export const RADIO_BUTTONS = [
  {
    action: 'radio-previous',
    label: 'Previous track',
    symbol: '◀',
    position: [-0.015, -0.105, 0.153],
  },
  {
    action: 'radio-play',
    label: 'Play / pause radio',
    symbol: '▶',
    position: [0.09, -0.105, 0.153],
  },
  {
    action: 'radio-next',
    label: 'Next track',
    symbol: '▶',
    position: [0.195, -0.105, 0.153],
  },
  {
    action: 'radio-quieter',
    label: 'Radio volume down',
    symbol: '−',
    position: [0.29, -0.105, 0.153],
  },
  {
    action: 'radio-louder',
    label: 'Radio volume up',
    symbol: '+',
    position: [0.29, -0.015, 0.153],
  },
] as const
export type RadioAction = (typeof RADIO_BUTTONS)[number]['action']
export const RADIO_ACTIONS = RADIO_BUTTONS.map((button) => button.action)
export function isRadioAction(value: unknown): value is RadioAction {
  return RADIO_ACTIONS.some((action) => action === value)
}
