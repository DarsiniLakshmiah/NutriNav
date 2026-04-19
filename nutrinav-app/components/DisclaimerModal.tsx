'use client'

interface DisclaimerModalProps {
  onAccept: () => void
}

export default function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[#1A7A6E] mb-3">Before We Start</h2>
        <p className="text-sm text-[#2C2C2C] leading-relaxed mb-4">
          NutriNav provides general healthy eating guidance based on available store inventory.
          It is <strong>not a substitute</strong> for medical or dietary advice.
        </p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed mb-4">
          If you have a medical condition (diabetes, hypertension, allergies, kidney disease, or are pregnant),
          please consult your healthcare provider or a registered dietitian before making dietary changes.
        </p>
        <p className="text-xs text-gray-400 mb-5">
          NutriNav is an independent tool. Not affiliated with DCCK, USDA, or DC SNAP.
        </p>
        <button
          onClick={onAccept}
          className="w-full py-3 bg-[#1A7A6E] text-white font-semibold rounded-xl text-base"
        >
          I Understand — Let&apos;s Plan Meals
        </button>
      </div>
    </div>
  )
}
