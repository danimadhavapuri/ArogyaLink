import { addCallbackTask } from '../data/store.js';

export const CLINICAL_TEMPLATES = {
  Haemoglobin: {
    low: {
      en: 'Your haemoglobin level is slightly below the normal range. Haemoglobin carries oxygen in your blood, so lower levels can cause mild fatigue or weakness. Eating iron-rich foods (spinach, dates, lentils) helps. Please discuss this with your doctor.',
      te: 'మీ రక్తంలో హిమోగ్లోబిన్ సాధారణ స్థాయి (12.0 - 15.5) కంటే కొంచెం తక్కువగా ఉంది. హిమోగ్లోబిన్ శరీరానికి ప్రాణవాయువును అందిస్తుంది, కాబట్టి ఇది తగ్గితే కొద్దిగా నీరసం లేదా అలసట రావచ్చు. పాలకూర, ఖర్జూరం, పప్పుధాన్యాలు ఆహారంలో తీసుకోవడం మంచిది. దయచేసి మీ డాక్టర్ గారిని సంప్రదించండి.',
      hi: 'आपका हीमोग्लोबिन सामान्य स्तर से थोड़ा कम है। हीमोग्लोबिन शरीर में ऑक्सीजन पहुंचाता है, इसलिए इसकी कमी से हल्की कमजोरी या थकान महसूस हो सकती है। हरी पत्तेदार सब्जियां और दालें खाएं। कृपया अपने डॉक्टर से परामर्श लें।'
    },
    high: {
      en: 'Your haemoglobin level is above the standard range. Staying well hydrated is recommended. Please review this with your doctor.',
      te: 'మీ హిమోగ్లోబిన్ సాధారణ స్థాయి కంటే ఎక్కువగా ఉంది. తగినంత మంచినీరు త్రాగడం మంచిది. దయచేసి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका हीमोग्लोबिन सामान्य से अधिक है। पर्याप्त पानी पिएं और डॉक्टर से सलाह लें।'
    }
  },
  'LDL cholesterol': {
    high: {
      en: 'Your LDL (often called "bad cholesterol") is above the optimal target of 100 mg/dL. Elevated LDL can gradually build up in blood vessels. Reducing fried foods, increasing daily walks, and reviewing your diet with your doctor is recommended.',
      te: 'మీ ఎల్‌డిఎల్ (చెడు కొలెస్ట్రాల్) సాధారణ స్థాయి (100) కంటే ఎక్కువగా ఉంది. ఇది రక్తనాళాల్లో కొవ్వు చేరడానికి కారణం కావచ్చు. వేపుళ్ళు, నూనె పదార్థాలు తగ్గించి, ప్రతిరోజూ నడక అలవాటు చేసుకోవడం మంచిది. దయచేసి మీ డాక్టర్ గారి సలహా తీసుకోండి.',
      hi: 'आपका एलडीएल (खराब कोलेस्ट्रॉल) सामान्य स्तर (100) से अधिक है। तली-भुनी चीजें कम करें और रोजाना टहलें। अपने डॉक्टर से सलाह लें।'
    }
  },
  Glucose: {
    high: {
      en: 'Your fasting blood sugar is above the normal range (70 - 99 mg/dL). This indicates elevated blood glucose. Avoid sugary beverages and sweets, and follow up with your doctor for proper evaluation.',
      te: 'మీ రక్తంలో గ్లూకోజ్ (షుగర్) స్థాయి సాధారణం (70 - 99) కంటే ఎక్కువగా ఉంది. తీపి పదార్థాలు తగ్గించి, తగిన ఆహార నియమాలు పాటించండి. పూర్తి వివరాల కోసం మీ డాక్టర్ గారిని సంప్రదించండి.',
      hi: 'आपका ब्लड शुगर सामान्य (70 - 99) से अधिक है। मीठी चीजें कम करें और डॉक्टर से परामर्श लें।'
    }
  },
  TSH: {
    high: {
      en: 'Your TSH level is mildly elevated, suggesting your thyroid gland may be working slightly slowly (hypothyroidism). This can cause mild lethargy or weight changes. Your doctor can guide you on management.',
      te: 'మీ టిఎస్హెచ్ (థైరాయిడ్) స్థాయి సాధారణం కంటే కొంచెం ఎక్కువగా ఉంది. దీనివల్ల కొద్దిగా బరువు పెరగడం లేదా నీరసం అనిపించవచ్చు. సరైన సలహా కోసం డాక్టర్ గారిని సంప్రదించండి.',
      hi: 'आपका टीएसएच (थायरॉयड) सामान्य से थोड़ा अधिक है। इससे हल्की थकान हो सकती है। डॉक्टर से सलाह लें।'
    }
  }
};

/**
 * Checks for clinical panic values
 */
export const isCriticalPanicValue = (parameter, result) => {
  const num = parseFloat(result);
  if (isNaN(num)) return false;

  // Medical panic ranges
  if (parameter === 'Potassium' && (num >= 6.0 || num <= 2.8)) return true;
  if (parameter === 'Haemoglobin' && num <= 7.0) return true;
  if (parameter === 'Glucose' && (num >= 350 || num <= 45)) return true;
  return false;
};

/**
 * Evaluates parameter against normal reference range
 */
export const evaluateParameter = (parameter, result, referenceRange) => {
  const numResult = parseFloat(result);
  if (isNaN(numResult)) {
    return { status: 'NORMAL', label: 'Normal' };
  }

  const parts = referenceRange.split('-').map((s) => parseFloat(s.trim()));
  const min = parts[0];
  const max = parts[1];

  if (!isNaN(min) && numResult < min) return { status: 'LOW', label: 'Below Normal' };
  if (!isNaN(max) && numResult > max) return { status: 'HIGH', label: 'Above Normal' };
  return { status: 'NORMAL', label: 'Within Normal Range' };
};

/**
 * Main summary generator with CRITICAL SAFETY INTERCEPT
 */
export const generateMultiLanguageSummary = (order) => {
  const { orderId, patientName, patientPhone, parameter, result, unit, referenceRange, isCritical, referringDoctor } = order;

  // ==============================================================
  // 🚨 CRITICAL SAFETY INTERCEPT (Per Isocode Brief Rule)
  // "Critical values get no summary and create a callback task for staff."
  // ==============================================================
  if (isCritical || isCriticalPanicValue(parameter, result)) {
    // Automatically trigger urgent callback task on Front-Desk console
    addCallbackTask({
      orderId,
      patientName,
      patientPhone,
      parameter,
      result: `${result} ${unit}`,
      referringDoctor,
      urgency: 'HIGH_CRITICAL',
      reason: `Critical panic value detected (${parameter}: ${result} ${unit}). AI summary suppressed for patient safety.`
    });

    return {
      isCritical: true,
      aiBlocked: true,
      status: 'CRITICAL',
      alertMessage: {
        en: '🚨 CRITICAL MEDICAL ALERT: A summary has not been shown because this result requires immediate medical attention. Our laboratory medical team has initiated an urgent callback with your referring doctor.',
        te: '🚨 అత్యవసర వైద్య హెచ్చరిక: ఈ ఫలితానికి తక్షణ వైద్య సహాయం అవసరమైనందున సాధారణ వివరణ నిలిపివేయబడింది. మా ల్యాబ్ వైద్య బృందం వెంటనే మీ డాక్టర్ గారిని సంప్రదిస్తున్నారు.',
        hi: '🚨 गंभीर मेडिकल अलर्ट: इस रिपोर्ट के लिए तत्काल डॉक्टर की देखरेख आवश्यक है। सामान्य सारांश रोक दिया गया है। हमारी मेडिकल टीम आपके डॉक्टर से तुरंत संपर्क कर रही है।'
      },
      actionRequired: 'Please visit your nearest emergency room or contact your referring doctor immediately.'
    };
  }

  // If not critical, evaluate normal vs out-of-range
  const evaluation = evaluateParameter(parameter, result, referenceRange);

  if (evaluation.status === 'NORMAL') {
    return {
      isCritical: false,
      aiBlocked: false,
      status: 'NORMAL',
      en: `Your ${parameter} (${result} ${unit}) is within the healthy reference range (${referenceRange}). No special action is required.`,
      te: `మీ ${parameter} (${result} ${unit}) సాధారణ ఆరోగ్యకరమైన పరిధిలో (${referenceRange}) ఉంది. ఎలాంటి ఆందోళన అవసరం లేదు.`,
      hi: `आपका ${parameter} (${result} ${unit}) सामान्य और स्वस्थ सीमा (${referenceRange}) के भीतर है।`
    };
  }

  // Out-of-Range Clinical Template
  const templateGroup = CLINICAL_TEMPLATES[parameter];
  const template = templateGroup
    ? evaluation.status === 'LOW'
      ? templateGroup.low
      : templateGroup.high
    : null;

  if (template) {
    return {
      isCritical: false,
      aiBlocked: false,
      status: evaluation.status,
      en: template.en,
      te: template.te,
      hi: template.hi
    };
  }

  // Generic fallback
  const flagText = evaluation.status === 'LOW' ? 'lower than' : 'higher than';
  const flagTextTe = evaluation.status === 'LOW' ? 'తక్కువగా' : 'ఎక్కువగా';
  const flagTextHi = evaluation.status === 'LOW' ? 'कम' : 'अधिक';

  return {
    isCritical: false,
    aiBlocked: false,
    status: evaluation.status,
    en: `Your ${parameter} result (${result} ${unit}) is ${flagText} the standard reference range (${referenceRange}). Please consult Dr. ${referringDoctor} for clinical guidance.`,
    te: `మీ ${parameter} ఫలితం (${result} ${unit}) సాధారణ పరిధి (${referenceRange}) కంటే ${flagTextTe} ఉంది. దయచేసి మీ డాక్టర్ గారి సలహా తీసుకోండి.`,
    hi: `आपका ${parameter} परिणाम (${result} ${unit}) सामान्य सीमा (${referenceRange}) से ${flagTextHi} है। डॉक्टर से परामर्श लें।`
  };
};