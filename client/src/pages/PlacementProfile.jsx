import { useState, useEffect } from 'react';
import { api, errMessage } from '../lib/api.js';
import { Spinner, ErrorNote } from '../components/ui.jsx';

const YEAR_OPTIONS = [1, 2, 3, 4];

export default function PlacementProfile() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');

  useEffect(() => {
    api.get('/placement/profile').then(({ data }) => setProfile({
      branch: '', year: '', skills: [], targetRoles: [], ...data.data.profile,
      targetCompanies: (data.data.profile.targetCompanies || []).map((c) => c._id || c),
    }));
  }, []);

  if (!profile) return <Spinner />;
  const set = (patch) => { setProfile((p) => ({ ...p, ...patch })); setSaved(false); };

  const isValidProfile = () => {
    const branch = profile.branch.trim();
    const year = Number(profile.year);
    const skills = profile.skills.map((s) => s.trim()).filter(Boolean);
    const targetRoles = profile.targetRoles.map((s) => s.trim()).filter(Boolean);
    return Boolean(branch && YEAR_OPTIONS.includes(year) && skills.length && targetRoles.length);
  };

  const save = async () => {
    const branch = profile.branch.trim();
    const year = Number(profile.year);
    const skills = profile.skills.map((s) => s.trim()).filter(Boolean);
    const targetRoles = profile.targetRoles.map((s) => s.trim()).filter(Boolean);

    setError('');
    if (!branch || !YEAR_OPTIONS.includes(year) || !skills.length || !targetRoles.length) {
      setError('Please fill in branch, select year 1-4, add at least one skill, and add at least one target role.');
      return;
    }

    try {
      await api.put('/placement/profile', {
        branch,
        year,
        skills,
        targetRoles,
      });
      setSaved(true);
    } catch (e) { setError(errMessage(e)); }
  };

  const addChip = (key, value, clear) => { if (value.trim()) { set({ [key]: [...profile[key], value.trim()] }); clear(''); } };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">My Placement Profile</h1>
      <p className="mb-4 text-sm text-slate-500">Used to personalize your recommendations.</p>
      {error && <ErrorNote message={error} />}
      {saved && <div className="mb-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">✓ Saved</div>}

      <div className="card space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Branch</label><input required className="input" value={profile.branch} onChange={(e) => set({ branch: e.target.value })} /></div>
          <div><label className="label">Year</label>
            <select required className="input" value={profile.year || ''} onChange={(e) => set({ year: e.target.value })}>
              <option value="">Select year</option>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <ChipEditor label="Skills" items={profile.skills} value={skillInput} setValue={setSkillInput}
          onAdd={() => addChip('skills', skillInput, setSkillInput)} onRemove={(s) => set({ skills: profile.skills.filter((x) => x !== s) })} />
        <ChipEditor label="Target roles" items={profile.targetRoles} value={roleInput} setValue={setRoleInput}
          onAdd={() => addChip('targetRoles', roleInput, setRoleInput)} onRemove={(s) => set({ targetRoles: profile.targetRoles.filter((x) => x !== s) })} />

        <button onClick={save} className="btn-primary" disabled={!isValidProfile()} title="Complete all required fields to save">Save profile</button>
      </div>
    </div>
  );
}

const ChipEditor = ({ label, items, value, setValue, onAdd, onRemove }) => (
  <div>
    <label className="label">{label}</label>
    <div className="mb-2 flex flex-wrap gap-1">
      {items.map((s) => (
        <span key={s} className="badge bg-brand-100 text-brand-700">{s}<button onClick={() => onRemove(s)} className="ml-1">×</button></span>
      ))}
    </div>
    <div className="flex gap-2">
      <input className="input" value={value} onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} placeholder={`Add ${label.toLowerCase()}…`} />
      <button onClick={onAdd} className="btn-ghost">Add</button>
    </div>
  </div>
);
