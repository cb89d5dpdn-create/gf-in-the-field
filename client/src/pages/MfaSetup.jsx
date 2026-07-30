import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const STEPS = {
  CHECKING: 'checking',
  ALREADY_ENROLLED: 'already_enrolled',
  SHOW_QR: 'show_qr',
  VERIFY: 'verify',
  SUCCESS: 'success',
}

export function MfaSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.CHECKING)
  const [factorId, setFactorId] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  // Check existing MFA factors on mount
  useEffect(() => {
    async function checkEnrollment() {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        toast.error('Failed to check MFA status')
        setStep(STEPS.SHOW_QR)
        return
      }
      const verified = data?.totp?.find((f) => f.status === 'verified')
      if (verified) {
        setStep(STEPS.ALREADY_ENROLLED)
      } else {
        await startEnrollment()
      }
    }
    checkEnrollment()
  }, [])

  async function startEnrollment() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'GF In The Field',
      })
      if (error) throw error
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setStep(STEPS.SHOW_QR)
    } catch (err) {
      toast.error(err.message || 'Failed to start MFA setup')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code from your authenticator app')
      return
    }
    setLoading(true)
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      })
      if (verifyError) throw verifyError

      setStep(STEPS.SUCCESS)
      toast.success('MFA enabled successfully!')
    } catch (err) {
      if (err.message?.toLowerCase().includes('invalid')) {
        toast.error('Incorrect code — check your authenticator app and try again')
      } else {
        toast.error(err.message || 'Verification failed')
      }
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  // Render states
  if (step === STEPS.CHECKING) {
    return (
      <Layout>
        <div className="max-w-md mx-auto flex items-center justify-center py-16">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-gf-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Checking MFA status…</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (step === STEPS.ALREADY_ENROLLED) {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-green-800 mb-2">MFA Already Active</h2>
            <p className="text-sm text-green-700 mb-6">
              Multi-factor authentication is already enabled on your account. Your admin access is protected.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gf-teal text-white font-semibold py-3 rounded-xl hover:bg-gf-dark transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (step === STEPS.SUCCESS) {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-green-800 mb-2">MFA Enabled</h2>
            <p className="text-sm text-green-700 mb-6">
              Your admin account is now protected with multi-factor authentication. You'll need your authenticator app on future logins.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gf-teal text-white font-semibold py-3 rounded-xl hover:bg-gf-dark transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // SHOW_QR → VERIFY flow
  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Set Up Multi-Factor Authentication</h1>
        <p className="text-sm text-gray-500 mb-6">Required for admin account access</p>

        {step === STEPS.SHOW_QR && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 font-medium mb-1">What you'll need</p>
              <p className="text-sm text-blue-700">
                An authenticator app on your phone — 1Password, Authy, or Google Authenticator all work.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                1. Open your authenticator app and scan this QR code
              </p>
              {qrCode ? (
                <div className="flex justify-center bg-white border border-gray-200 rounded-xl p-4">
                  <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="flex justify-center bg-gray-50 border border-gray-200 rounded-xl p-4 h-56 items-center">
                  <div className="w-6 h-6 border-2 border-gf-teal border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {secret && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {showSecret ? 'Hide' : "Can't scan? Show manual entry key"}
                </button>
                {showSecret && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Manual entry key</p>
                    <p className="font-mono text-sm text-gray-800 break-all">{secret}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setStep(STEPS.VERIFY)}
              disabled={!qrCode}
              className="w-full bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark disabled:opacity-50 transition-colors"
            >
              I've scanned it — Next
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-gray-600 text-sm hover:text-gray-800 py-2"
            >
              Cancel
            </button>
          </div>
        )}

        {step === STEPS.VERIFY && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                Open your authenticator app, find <strong>GF In The Field</strong>, and enter the 6-digit code below.
              </p>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                6-digit verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gf-teal focus:border-transparent"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-gf-teal text-white font-semibold py-4 rounded-xl hover:bg-gf-dark disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify & Enable MFA'}
            </button>

            <button
              type="button"
              onClick={() => { setStep(STEPS.SHOW_QR); setCode('') }}
              className="w-full text-gray-600 text-sm hover:text-gray-800 py-2"
            >
              ← Back to QR code
            </button>
          </form>
        )}
      </div>
    </Layout>
  )
}
