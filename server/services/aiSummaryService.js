import { addCallbackTask } from '../data/store.js';

/**
 * Pre-validated clinical templates for the most common diagnostic tests.
 * Per Isocode brief: "When the AI is wrong: summaries use locked templates for the 30 most common tests"
 */
const CLINICAL_TEMPLATES = {
  Haemoglobin: {
    low: {
      en: 'Your haemoglobin level is slightly below the normal range. Haemoglobin carries oxygen throughout your body, so lower levels can cause mild fatigue or weakness. Eating iron-rich foods (spinach, dates, lentils) helps. Please discuss this with your referring doctor.',
      te: 'మీ రక్తంలో హిమోగ్లోబిన్ సాధారణ స్థాయి (12.0 - 15.5) కంటే కొంచెం తక్కువగా ఉంది. హిమోగ్లోబిన్ శరీరానికి ప్రాణవాయువును అందిస్తుంది, కాబట్టి ఇది తగ్గితే కొద్దిగా నీరసం లేదా అలసట రావచ్చు. పాలకూర, ఖర్జూరం, పప్పుధాన్యాలు ఆహారంలో తీసుకోవడం మంచిది. దయచేసి మీ డాక్టర్ గారిని సంప్రదించండి.',
      hi: 'आपका हीमोग्लोबिन सामान्य स्तर से थोड़ा कम है। हीमोग्लोबिन शरीर में ऑक्सीजन पहुंचाता है, इसलिए इसकी कमी से हल्की कमजोरी या थकान महसूस हो सकती है। हरी पत्तेदार सब्जियां और दालें खाएं। कृपया अपने डॉक्टर से परामर्श लें।'
    },
    high: {
      en: 'Your haemoglobin level is higher than the standard reference range. Staying well hydrated is recommended. Please review this with your doctor.',
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
 * Checks if a parameter result is dangerously critical
 */
export const isCriticalValue = (parameter, result) => {
  const num = parseFloat(result);
  if (isNaN(num)) return false;

  // Medical critical boundaries
  if (parameter === 'Potassium' && (num >= 6.0 || num <= 2.8)) return true;
  if (parameter === 'Haemoglobin' && num <= 7.0) return true;
  if (parameter === 'Glucose' && (num >= 350 || num <= 45)) return true;
  return false;
};

/**
 * Generates plain-language summary with clinical safety rules
 */
export const generateReportSummary = (order) => {
  const { orderId, patientName, parameter, result, unit, referenceRange, isCritical } = order;

  // 1. CRITICAL SAFETY RULE (Per Isocode Brief):
  // "Critical values get no summary and create a callback task for staff."
  if (isCritical || isCriticalValue(parameter, result)) {
    // Automatically trigger urgent callback task for front-desk staff
    addCallbackTask({
      orderId,
      patientName,
      patientPhone: order.patientPhone,
      parameter,
      result: `${result} ${unit}`,
      referringDoctor: order.referringDoctor,
      urgency: 'HIGH_CRITICAL',
      reason: `Critical panic value detected (${parameter}: ${result} ${unit}). AI summary suppressed for patient safety.`
    });

    return {
      orderId,
      isCritical: true,
      aiBlocked: true,
      alertMessage: {
        en: 'CRITICAL VALUE DETECTED: A summary has not been shown because this result requires immediate medical attention. Our laboratory medical officer has initiated an urgent callback with your referring doctor.',
        te: 'అత్యవసర ఫలితం గుర్తించబడింది: ఈ ఫలితానికి తక్షణ వైద్య సహాయం అవసరమైనందున సాధారణ వివరణ నిలిపివేయబడింది. మా ల్యాబ్ మెడికల్ ఆఫీసర్ వెంటనే మీ డాక్టర్ గారిని సంప్రదిస్తున్నారు.',
        hi: 'गंभीर परिणाम: इस रिपोर्ट के लिए तत्काल डॉक्टर की सलाह आवश्यक है। हमारी मेडिकल टीम आपके डॉक्टर से तुरंत संपर्क कर रही है।'
      },
      nextStep: 'Please contact your hospital or doctor immediately.'
    };
  }

  // 2. Normal vs Out-of-Range evaluation
  const numResult = parseFloat(result);
  const [minStr, maxStr] = referenceRange.split('-').map((s) => s.trim());
  const min = parseFloat(minStr);
  const max = parseFloat(maxStr);

  let statusFlag = 'NORMAL';
  if (!isNaN(min) && numResult < min) statusFlag = 'LOW';
  if (!isNaN(max) && numResult > max) statusFlag = 'HIGH';

  // If result is normal
  if (statusFlag === 'NORMAL') {
    return {
      orderId,
      isCritical: false,
      aiBlocked: false,
      statusFlag: 'NORMAL',
      summaries: {
        en: `Your ${parameter} level is ${result} ${unit}, which is within the healthy normal reference range (${referenceRange}). No special action is needed.`,
        te: `మీ ${parameter} స్థాయి ${result} ${unit} గా ఉంది, ఇది సాధారణ ఆరోగ్యకరమైన పరిధిలో (${referenceRange}) ఉంది. ఎలాంటి ఆందోళన అవసరం లేదు.`,
        hi: `आपका ${parameter} स्तर ${result} ${unit} है, जो सामान्य और स्वस्थ सीमा (${referenceRange}) के भीतर है।`
      },
      disclaimer: 'This summary is an educational aid and does not substitute for clinical advice from your physician.'
    };
  }

  // 3. Out-of-Range Clinical Template Retrieval
  const templateGroup = CLINICAL_TEMPLATES[parameter];
  const template = templateGroup
    ? statusFlag === 'LOW'
      ? templateGroup.low
      : templateGroup.high
    : null;

  if (template) {
    return {
      orderId,
      isCritical: false,
      aiBlocked: false,
      statusFlag,
      summaries: {
        en: template.en,
        te: template.te,
        hi: template.hi
      },
      disclaimer: 'This summary is an educational aid and does not substitute for clinical advice from your referring doctor.'
    };
  }

  // Generic fallback if parameter is not in template list
  return {
    orderId,
    isCritical: false,
    aiBlocked: false,
    statusFlag,
    summaries: {
      en: `Your ${parameter} result (${result} ${unit}) is ${statusFlag.toLowerCase()} compared to the reference range (${referenceRange}). Please consult your doctor for personalized advice.`,
      te: `మీ ${parameter} ఫలితం (${result} ${unit}) సాధారణ పరిధి (${referenceRange}) కంటే ${statusFlag === 'LOW' ? 'తక్కువగా' : 'ఎక్కువగా'} ఉంది. దయచేసి పూర్తి వివరాల కోసం మీ డాక్టర్‌ను సంప్రదించండి.`,
      hi: `आपका ${parameter} परिणाम (${result} ${unit}) सामान्य सीमा (${referenceRange}) से ${statusFlag === 'LOW' ? 'कम' : 'अधिक'} है। डॉक्टर से सलाह लें।`
    },
    disclaimer: 'This summary is an educational aid and does not substitute for clinical advice from your referring doctor.'
  };
};