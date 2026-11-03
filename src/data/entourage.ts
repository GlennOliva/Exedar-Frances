export interface NamePair {
  left: string
  right: string
}

export interface NamedRole {
  role: string
  names: readonly string[]
}

export const entourage = {
  parents: [
    ['Peter Paul A. Jardenico', 'Almer D. Montecillo'],
    ['Ermelinda A. Tapic', 'Jeroselle P. Argillo'],
  ] satisfies ReadonlyArray<readonly [string, string]>,
  principalSponsors: [
    { left: 'Dr. Josel Rey L. Aguelo', right: 'Dr. Allyne Montecillo Aguelo' },
    { left: 'Mr. Marc Jayson C. Abe', right: 'Mrs. Allyza A. Abe' },
    { left: 'Mr. Eric A. Oliva', right: 'Dr. Elleine Rose A. Oliva' },
    { left: 'Engr. Rey Dhannel O. Rios', right: 'Mrs. Lou Zambrano' },
    { left: 'Engr. Romel Alfredo Ruiz', right: 'Atty. Marilou Dureza Aldevera' },
    { left: 'Atty. Joseph Dominic Felizarta', right: 'Mrs. Ruby L. Vicente' },
    { left: 'Mr. Edgar Del Mundo', right: 'Engr. Nelda Bitoon Salada' },
    { left: 'Mr. Alberto O. Jison', right: 'Mrs. Carlota P. Montecillo' },
    { left: 'Atty. Arnold Doria', right: 'Mrs. Rg May L. Yap' },
    { left: 'Mr. Mark Huang', right: 'Mrs. Arma Huang' },
    { left: 'Mr. Romano A. Jardenico', right: 'Mrs. Joy S. Jardenico' },
    { left: 'Dr. Chito R. Napitan', right: 'Dr. Eva Aranas-Angel' },
    { left: 'Mr. Roy Tapic', right: 'Mrs. Donna Tapic' },
    { left: 'Mr. Brandon Tapic', right: 'Mrs. Mabie Y. Tapic' },
    { left: 'Engr. Raoul Bryan M. Caralos', right: 'Mrs. Fatima M. Caralos' },
    { left: 'Hon. Joel G. Calma', right: 'Mrs. Mina C. Calma' },
  ] satisfies readonly NamePair[],
  honor: [
    { role: 'Best Man', names: ['James Carlo S. Jardenico'] },
    { role: 'Maid of Honor', names: ['Faith Dorothy M. Caralos'] },
  ] satisfies readonly NamedRole[],
  attendants: [
    { left: 'Ellis Paul P. Argillo', right: 'Cristine Mae A. Tapic' },
    { left: 'Josel Andrei M. Aguelo', right: 'Allyne Therese M. Aguelo' },
    { left: 'Princely A. Oliva', right: 'Alessa Frances A. Montecillo' },
    { left: 'Raymond Gabriel M. Rios', right: 'Karen Jane T. Jardenico' },
    { left: 'Raymond Paolo S. Jardenico', right: 'Mary Angeline B. Alajar' },
    { left: 'Mikko B. Jardenico', right: 'Yomichirei C. Arieta' },
    { left: 'Jeff N. Jardenico', right: 'Roxanne Joy S. Jardenico' },
    { left: 'Glenn Angelo V. Oliva', right: 'Samantha J. Berongoy' },
  ] satisfies readonly NamePair[],
  symbols: [
    { role: 'Candle', names: ['Mr. Marc Jayson C. Abe', 'Mrs. Allyza A. Abe'] },
    { role: 'Cord', names: ['Mr. Perceival L. Berongoy', 'Mrs. Jane J. Berongoy'] },
    { role: 'Veil', names: ['Dr. Josel Rey L. Aguelo', 'Dr. Allyne Montecillo Aguelo'] },
  ] satisfies readonly NamedRole[],
  bearers: [
    { role: 'Ring Bearer', names: ['Prince Nathan A. Jardenico'] },
    { role: 'Bible Bearer', names: ['Franco Miguel F. Argillo'] },
    { role: 'Coin Bearer', names: ['Perseus Hadraniel I. Argillo'] },
  ] satisfies readonly NamedRole[],
  flowerGirls: [
    { left: 'Allyson Kaia A. Abe', right: 'Lady Paulline A. Jardenico' },
    { left: 'Almira Joy A. Montecillo', right: 'Rei Gem M. Navaja' },
  ] satisfies readonly NamePair[],
  cousin: 'Josel Francis M. Aguelo',
} as const
