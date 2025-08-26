import React, { useEffect, useState, useCallback, useMemo } from 'react';

const BASE_URL = (import.meta.env.VITE_BASE_URL || '').replace(/\/+$/, '');

const Adminformtimer = () => {
  const [open, setOpen] = useState(false);

  // server snapshot
  const [settings, setSettings] = useState(null);

  // form state
  const [rewardPerStudent, setRewardPerStudent] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [maxStudentsBeforeBlock, setMaxStudentsBeforeBlock] = useState(0);
  const [blockDurationMinutes, setBlockDurationMinutes] = useState(0);

  // ui state
  const [loading, setLoading] = useState(false);  // GET
  const [saving, setSaving] = useState(false);    // PUT
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('authToken') || '';

  const applyFrom = (s) => {
    setRewardPerStudent(Number(s?.rewardPerStudent ?? 0));
    setCooldownSeconds(Number(s?.cooldownSeconds ?? 0));
    setMaxStudentsBeforeBlock(Number(s?.maxStudentsBeforeBlock ?? 0));
    setBlockDurationMinutes(Number(s?.blockDurationMinutes ?? 0));
  };

  const fetchSettings = useCallback(async () => {
    if (!BASE_URL) {
      setError('VITE_BASE_URL is not set. Add it to .env and restart dev server.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/user/settings?ngrok-skip-browser-warning=true&_=${Date.now()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      const ctype = res.headers.get('content-type')?.toLowerCase() || '';
      const isJson = ctype.includes('application/json');
      const data = isJson ? await res.json() : null;

      if (!res.ok) throw new Error(data?.message || `Failed to fetch settings (HTTP ${res.status})`);

      const s = data?.settings || data;
      setSettings(s);
      applyFrom(s);
    } catch (e) {
      setError(e.message || 'Something went wrong while fetching settings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open) fetchSettings();
  }, [open, fetchSettings]);

  // dirty check
  const isDirty = useMemo(() => {
    if (!settings) return false;
    return (
      Number(settings.rewardPerStudent ?? 0)        !== Number(rewardPerStudent) ||
      Number(settings.cooldownSeconds ?? 0)         !== Number(cooldownSeconds) ||
      Number(settings.maxStudentsBeforeBlock ?? 0)  !== Number(maxStudentsBeforeBlock) ||
      Number(settings.blockDurationMinutes ?? 0)    !== Number(blockDurationMinutes)
    );
  }, [settings, rewardPerStudent, cooldownSeconds, maxStudentsBeforeBlock, blockDurationMinutes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const body = {
        rewardPerStudent: Number(rewardPerStudent),
        cooldownSeconds: Number(cooldownSeconds),
        maxStudentsBeforeBlock: Number(maxStudentsBeforeBlock),
        blockDurationMinutes: Number(blockDurationMinutes),
      };

      // 🔁 UPDATE via PUT (as you said)
      const res = await fetch(
        `${BASE_URL}/user/updatesetting?ngrok-skip-browser-warning=true&_=${Date.now()}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        }
      );

      const ctype = res.headers.get('content-type')?.toLowerCase() || '';
      const isJson = ctype.includes('application/json');
      const data = isJson ? await res.json() : null;

      if (!res.ok) throw new Error(data?.message || `Failed to update settings (HTTP ${res.status})`);

      setSuccess(data?.message || 'Settings updated successfully');
      if (data?.settings) {
        setSettings(data.settings);
        applyFrom(data.settings);
      }
      setTimeout(() => setSuccess(''), 2000);
    } catch (e) {
      setError(e.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setError('');
    setSuccess('');
  };

  const handleReset = () => fetchSettings();

  const numberInput =
    'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 ' +
    'focus:border-blue-500 block w-full p-2.5';

  const updatedAt = useMemo(() => {
    const t = settings?.updatedAt ? new Date(settings.updatedAt) : null;
    return t ? t.toLocaleString() : null;
  }, [settings]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none 
        focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
      >
        Settings
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeModal}
        >
          <div
            className="relative bg-white rounded-2xl shadow-lg w-full max-w-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xl font-semibold">Platform Settings</h3>
                <p className="text-xs text-gray-500">Reward, cooldown, blocking limits — live controls.</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900 rounded-lg w-8 h-8 flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && <div className="mt-4 rounded-md bg-red-50 text-red-700 text-sm p-3">{error}</div>}
            {success && <div className="mt-4 rounded-md bg-green-50 text-green-700 text-sm p-3">{success}</div>}

            {settings && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div>Server reward/Student: <b>{settings.rewardPerStudent}</b></div>
                <div>Cooldown: <b>{settings.cooldownSeconds}s</b></div>
                <div>Max before block: <b>{settings.maxStudentsBeforeBlock}</b></div>
                <div>Block duration: <b>{settings.blockDurationMinutes}m</b></div>
                {updatedAt && <div className="col-span-2 text-right">Last updated: <b>{updatedAt}</b></div>}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="rewardPerStudent" className="block mb-1 text-sm font-medium text-gray-900">
                  Reward per Student (₹)
                </label>
                <input
                  type="number"
                  id="rewardPerStudent"
                  min={0}
                  step="1"
                  className={numberInput}
                  value={rewardPerStudent}
                  onChange={(e) => setRewardPerStudent(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="cooldownSeconds" className="block mb-1 text-sm font-medium text-gray-900">
                  Cooldown (seconds)
                </label>
                <input
                  type="number"
                  id="cooldownSeconds"
                  min={0}
                  step="1"
                  className={numberInput}
                  value={cooldownSeconds}
                  onChange={(e) => setCooldownSeconds(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="maxStudentsBeforeBlock" className="block mb-1 text-sm font-medium text-gray-900">
                  Max Students Before Block
                </label>
                <input
                  type="number"
                  id="maxStudentsBeforeBlock"
                  min={1}
                  step="1"
                  className={numberInput}
                  value={maxStudentsBeforeBlock}
                  onChange={(e) => setMaxStudentsBeforeBlock(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="blockDurationMinutes" className="block mb-1 text-sm font-medium text-gray-900">
                  Block Duration (minutes)
                </label>
                <input
                  type="number"
                  id="blockDurationMinutes"
                  min={1}
                  step="1"
                  className={numberInput}
                  value={blockDurationMinutes}
                  onChange={(e) => setBlockDurationMinutes(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-gray-500">
                  {isDirty ? <span className="text-yellow-700">• Unsaved changes</span> : 'No changes'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={loading || saving}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={closeModal}
                    disabled={loading || saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 disabled:opacity-60"
                    disabled={loading || saving || !isDirty}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </form>

            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
                <div className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Adminformtimer;
