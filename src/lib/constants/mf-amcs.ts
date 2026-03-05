interface AMCDef {
  name: string;
  pattern: RegExp;
}

const AMC_LIST: AMCDef[] = [
  { name: 'SBI', pattern: /^sbi\b/i },
  { name: 'HDFC', pattern: /^hdfc\b/i },
  { name: 'ICICI Prudential', pattern: /^icici\s*pru/i },
  { name: 'Axis', pattern: /^axis\b/i },
  { name: 'Kotak', pattern: /^kotak\b/i },
  { name: 'Nippon India', pattern: /^nippon\s*india/i },
  { name: 'Aditya Birla Sun Life', pattern: /^aditya\s*birla/i },
  { name: 'UTI', pattern: /^uti\b/i },
  { name: 'DSP', pattern: /^dsp\b/i },
  { name: 'Tata', pattern: /^tata\b/i },
  { name: 'Mirae Asset', pattern: /^mirae\s*asset/i },
  { name: 'Motilal Oswal', pattern: /^motilal\s*oswal/i },
  { name: 'Franklin Templeton', pattern: /^franklin\b/i },
  { name: 'Sundaram', pattern: /^sundaram\b/i },
  { name: 'Canara Robeco', pattern: /^canara\s*robeco/i },
  { name: 'PPFAS', pattern: /^(parag\s*parikh|ppfas)/i },
  { name: 'Invesco', pattern: /^invesco\b/i },
  { name: 'Bandhan', pattern: /^bandhan\b/i },
  { name: 'Edelweiss', pattern: /^edelweiss\b/i },
  { name: 'Quant', pattern: /^quant\b/i },
  { name: 'HSBC', pattern: /^hsbc\b/i },
  { name: 'Mahindra Manulife', pattern: /^mahindra\b/i },
  { name: 'Union', pattern: /^union\b/i },
  { name: 'Baroda BNP Paribas', pattern: /^baroda\b/i },
  { name: 'LIC', pattern: /^lic\b/i },
  { name: 'PGIM India', pattern: /^pgim\b/i },
  { name: 'JM Financial', pattern: /^jm\b/i },
  { name: 'Bank of India', pattern: /^bank\s*of\s*india/i },
  { name: 'Groww', pattern: /^groww\b/i },
  { name: 'Navi', pattern: /^navi\b/i },
  { name: 'Samco', pattern: /^samco\b/i },
  { name: 'Trust', pattern: /^trust\b/i },
  { name: 'WhiteOak Capital', pattern: /^whiteoak/i },
  { name: 'ITI', pattern: /^iti\b/i },
  { name: 'Helios', pattern: /^helios\b/i },
  { name: 'Shriram', pattern: /^shriram\b/i },
  { name: '360 ONE', pattern: /^360\s*one/i },
  { name: 'Zerodha', pattern: /^zerodha\b/i },
  { name: 'Old Bridge', pattern: /^old\s*bridge/i },
  { name: 'NJ', pattern: /^nj\b/i },
];

export function extractAMC(schemeName: string): string {
  for (const amc of AMC_LIST) {
    if (amc.pattern.test(schemeName)) {
      return amc.name;
    }
  }
  return 'Other';
}
