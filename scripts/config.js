// scripts/config.js - WB API base URL and indicator definitions

const WB_BASE = 'https://api.worldbank.org/v2';

// Indicator definitions — WB API IDs, max values for progress bars, display units
const indicatorData = {
  economy: [
    { name: 'GDP per capita',  id: 'NY.GDP.PCAP.CD', max: 80000,     unit: 'USD',   isPercent: false },
    { name: 'GNI per capita',  id: 'NY.GNP.PCAP.CD', max: 75000,     unit: 'USD',   isPercent: false },
    { name: 'Inflation',       id: 'FP.CPI.TOTL.ZG', max: 30,        unit: '%',     isPercent: true  },
    { name: 'Unemployment',    id: 'SL.UEM.TOTL.ZS', max: 25,        unit: '%',     isPercent: true  }
  ],
  health: [
    { name: 'Life expectancy',     id: 'SP.DYN.LE00.IN', max: 90,   unit: 'yrs',   isPercent: false },
    { name: 'Mortality rate (u5)', id: 'SH.DYN.MORT',    max: 150,  unit: '/1k',   isPercent: false },
    { name: 'Physicians/1k',       id: 'SH.MED.PHYS.ZS', max: 5,    unit: '/1k',   isPercent: false },
    { name: 'Hospital beds/1k',    id: 'SH.MED.BEDS.ZS', max: 10,   unit: '/1k',   isPercent: false }
  ],
  technology: [
    { name: 'High-tech exports',    id: 'TX.VAL.TECH.MF.ZS', max: 60,  unit: '%',     isPercent: true  },
    { name: 'R&D expenditure',      id: 'GB.XPD.RSDV.GD.ZS', max: 5,   unit: '% GDP', isPercent: true  },
    { name: 'Internet users',       id: 'IT.NET.USER.ZS',     max: 100, unit: '%',     isPercent: true  },
    { name: 'Mobile subscriptions', id: 'IT.CEL.SETS.P2',     max: 200, unit: '/100',  isPercent: false }
  ],
  environment: [
    { name: 'CO2 emissions',    id: 'EN.ATM.CO2E.KT',    max: 10000000, unit: 'kt',    isPercent: false },
    { name: 'Forest area',      id: 'AG.LND.FRST.ZS',    max: 100,      unit: '%',     isPercent: true  },
    { name: 'Renewable energy', id: 'EG.FEC.RNEW.ZS',    max: 100,      unit: '%',     isPercent: true  },
    { name: 'PM2.5 exposure',   id: 'EN.ATM.PM25.MC.M3', max: 100,      unit: 'µg/m³', isPercent: false }
  ],
  education: [
    { name: 'Literacy rate',        id: 'SE.ADT.LITR.ZS',    max: 100, unit: '%',     isPercent: true  },
    { name: 'Secondary enrollment', id: 'SE.SEC.ENRR',        max: 150, unit: '%',     isPercent: true  },
    { name: 'Tertiary enrollment',  id: 'SE.TER.ENRR',        max: 100, unit: '%',     isPercent: true  },
    { name: 'Govt education spend', id: 'SE.XPD.TOTL.GD.ZS', max: 15,  unit: '% GDP', isPercent: true  }
  ],
  population: [
    { name: 'Total population',  id: 'SP.POP.TOTL',        max: 1400000000, unit: '',  isPercent: false },
    { name: 'Population growth', id: 'SP.POP.GROW',        max: 4,          unit: '%', isPercent: true  },
    { name: 'Urban population',  id: 'SP.URB.TOTL.IN.ZS', max: 100,        unit: '%', isPercent: true  },
    { name: 'Dependency ratio',  id: 'SP.POP.DPND',        max: 110,        unit: '%', isPercent: true  }
  ],
  poverty: [
    { name: 'Poverty ($2.15/day)', id: 'SI.POV.DDAY', max: 80, unit: '%', isPercent: true  },
    { name: 'Multidim poverty',    id: 'SI.POV.MDIM', max: 80, unit: '%', isPercent: true  },
    { name: 'Gini index',          id: 'SI.POV.GINI', max: 70, unit: '',  isPercent: false },
    { name: 'Poverty gap',         id: 'SI.POV.GAPS', max: 40, unit: '%', isPercent: true  }
  ],
  gender: [
    { name: 'Gender parity (sec)', id: 'SE.ENR.SECO.FM.ZS', max: 1.2,  unit: 'ratio', isPercent: false },
    { name: 'Female labour force', id: 'SL.TLF.TOTL.FE.ZS', max: 100,  unit: '%',     isPercent: true  },
    { name: 'Female literacy',     id: 'SE.ADT.LITR.FE.ZS', max: 100,  unit: '%',     isPercent: true  },
    { name: 'Maternal mortality',  id: 'SH.STA.MMRT',        max: 2000, unit: '/100k', isPercent: false }
  ],
  inequality: [
    { name: 'Income share top 10%', id: 'SI.DST.10TH.10', max: 60, unit: '%', isPercent: true  },
    { name: 'Income share bot 20%', id: 'SI.DST.FRST.20', max: 15, unit: '%', isPercent: true  },
    { name: 'Bottom 40% growth',    id: 'SI.SPR.PC40.ZG', max: 10, unit: '%', isPercent: true  },
    { name: 'Poverty gap',          id: 'SI.POV.GAPS',    max: 40, unit: '%', isPercent: true  }
  ]
};
