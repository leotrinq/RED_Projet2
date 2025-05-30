import React, { useState, useEffect } from "react";
import Ajv from "ajv";

const fieldLabels = {
  '/fil/titre': 'Title',
  '/fil/participants': 'Participants',
  '/message/expediteur': 'Sender',
  '/message/texte': 'Free text',
  '/message/structure/type': 'Structure type',
  '/message/structure/question': 'Structured question',
  '/message/structure/options': 'Options',
  '/message/extension_films/film_choisi': 'Chosen film',
  '/message/extension_films/genre': 'Genre',
  '/message/extension_films/duree_minutes': 'Duration (minutes)',
  '/message/extension_films/note_sur_10': 'Rating out of 10',
  '/message/extension_films/seance/date': 'Session date',
  '/message/extension_films/seance/heure': 'Session time',
  '/message/extension_jeuxvideos/jeu_choisi': 'Chosen game',
  '/message/extension_jeuxvideos/plateforme': 'Platform',
  '/message/extension_jeuxvideos/temps_jeu_heure': 'Play time (hours)',
  '/message/extension_jeuxvideos/note_sur_10': 'Rating out of 10 (game)',
  '/message/extension_jeuxvideos/multijoueur': 'Multiplayer',
  '/message/extension_astronomie/nom_exoplanete': 'Exoplanet name',
  '/message/extension_astronomie/distance_annees_lumiere': 'Distance (light-years)',
  '/message/extension_astronomie/decouverte_annee': 'Discovery year',
  '/message/extension_astronomie/type_etoile_hote': 'Host star type',
  '/message/extension_astronomie/habitable': 'Potentially habitable'
};

const structureTypeByExtension = {
  films: 'choix_multiple',
  jeuxvideos: 'choix_multiple',
  astronomie: 'texte_libre'
};

const extensions = {
  films: {
    label: "Films",
    fields: [
      { name: "film_choisi", label: "Film chosen", type: "text" },
      { name: "genre", label: "Genre", type: "text" },
      { name: "duree_minutes", label: "Duration (minutes)", type: "number" },
      { name: "note_sur_10", label: "Rating out of 10", type: "number" },
      { name: "date", label: "Session date", type: "date" },
      { name: "heure", label: "Session time", type: "time" }
    ],
    schema: "/schema_extension_films.json"
  },
  jeuxvideos: {
    label: "Video Games",
    fields: [
      { name: "jeu_choisi", label: "Game chosen", type: "text" },
      { name: "plateforme", label: "Platform", type: "text" },
      { name: "temps_jeu_heure", label: "Play time (hours)", type: "number" },
      { name: "note_sur_10", label: "Rating out of 10", type: "number" },
      { name: "multijoueur", label: "Multiplayer", type: "checkbox" }
    ],
    schema: "/schema_extension_jeuxvideos.json"
  },
  astronomie: {
    label: "Astronomy",
    fields: [
      { name: "nom_exoplanete", label: "Exoplanet name", type: "text" },
      { name: "distance_annees_lumiere", label: "Distance (light-years)", type: "number" },
      { name: "decouverte_annee", label: "Discovery year", type: "number" },
      { name: "type_etoile_hote", label: "Host star type", type: "text" },
      { name: "habitable", label: "Potentially habitable", type: "checkbox" }
    ],
    schema: "/schema_extension_astronomie.json"
  }
};

const formatError = err => {
  const label = fieldLabels[err.pointer] || err.pointer;
  const { keyword, params, message } = err;
  switch (keyword) {
    case 'minLength': return `${label} must contain at least ${params.limit} character(s)`;
    case 'type': return `${label} must be of type ${params.type}`;
    case 'format': return `${label} must match format ${params.format}`;
    case 'pattern': return `${label} must match pattern ${params.pattern}`;
    case 'enum': return `${label} must be one of the proposed options`;
    case 'participation': return `${label} must be one of the participants`;
    default: return `${label}: ${message}`;
  }
};

const normalizeErrors = errs => errs.map(err => {
  let pointer = err.instancePath;
  if (!pointer && err.schemaPath) {
    const match = /properties\/(\w+)/.exec(err.schemaPath);
    if (match) pointer = '/' + match[1];
  }
  return { pointer, keyword: err.keyword, params: err.params, message: err.message };
});

export default function App() {
  const [extension, setExtension] = useState("films");
  const [messageData, setMessageData] = useState({});
  const [infos, setInfos] = useState({ titre: "", participants: "", expediteur: "", texte: "", question: "", options: "" });
  const [schemas, setSchemas] = useState({ noyau: null, extension: null });
  const [errors, setErrors] = useState([]);
  const [jsonOutput, setJsonOutput] = useState(null);
  const [autoValues, setAutoValues] = useState(true);

  useEffect(() => {
    fetch("/schema_noyau.json").then(r => r.json()).then(data => setSchemas(s => ({ ...s, noyau: data })));
    fetch(extensions[extension].schema).then(r => r.json()).then(data => setSchemas(s => ({ ...s, extension: data })));
  }, [extension]);

  useEffect(() => {
    if (!autoValues) return;
    const presets = {
      films: { titre: "Movie Night", participants: "Leo,Elie", expediteur: "Leo", texte: "Which movie do you want to watch?", question: "Choose a film", options: "Interstellar, Tenet, Inception" },
      jeuxvideos: { titre: "Gaming Talk", participants: "Leo,Ali", expediteur: "Ali", texte: "Want to try this game?", question: "Choose a game", options: "Outer Wilds, Cyberpunk 2077" },
      astronomie: { titre: "Astro Chat", participants: "Ali,Elie", expediteur: "Elie", texte: "Look at this amazing exoplanet!", question: "What do you think?", options: "" }
    };
    setInfos(presets[extension]);
  }, [autoValues, extension]);

  const handleInfoChange = e => setInfos(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleChange = e => {
    const { name, type, value, checked } = e.target;
    setMessageData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  const generateJSON = () => {
    const structureType = structureTypeByExtension[extension];
    const options = infos.options.split(",").map(s => s.trim()).filter(Boolean);
    const structure = { type: structureType, question: infos.question.trim() };
    if (structureType === "choix_multiple") structure.options = options;

    const fil = {
      id: "fil_auto",
      titre: infos.titre.trim(),
      participants: infos.participants.split(",").map(p => p.trim()).filter(Boolean)
    };

    const extFields = extensions[extension].fields;
    const extData = {};
    extFields.forEach(f => {
      if (extension === "films" && (f.name === "date" || f.name === "heure")) {
        extData.seance = extData.seance || {};
        extData.seance[f.name] = messageData[f.name] || "";
      } else {
        extData[f.name] = messageData[f.name] !== undefined ? messageData[f.name] : (f.type === "checkbox" ? false : "");
      }
    });

    const message = {
      id: "msg_auto",
      expediteur: infos.expediteur.trim(),
      date: new Date().toISOString(),
      texte: infos.texte.trim(),
      structure,
      [`extension_${extension}`]: extData
    };

    const ajv = new Ajv({ coerceTypes: true, allErrors: true, strict: false });
    const validateN = schemas.noyau && ajv.compile(schemas.noyau);
    const validateE = schemas.extension && ajv.compile(schemas.extension);
    let errs = [];
    if (validateN && !validateN({ fil, message: { ...message } })) errs.push(...validateN.errors);
    if (validateE && !validateE(message[`extension_${extension}`])) errs.push(...validateE.errors);
    if (!fil.participants.includes(message.expediteur)) errs.push({ instancePath: '/message/expediteur', keyword: 'participation', params: {}, message: '' });

    if (structureType === "choix_multiple") {
      const expected = message.structure.options;
      const selected = extData[extension === "films" ? "film_choisi" : "jeu_choisi"];
      if (!expected.includes(selected)) {
        errs.push({ instancePath: `/message/extension_${extension}/${extension === "films" ? "film_choisi" : "jeu_choisi"}`, keyword: 'enum', params: {}, message: '' });
      }
    }

    const normalized = normalizeErrors(errs);
    setErrors(normalized);
    setJsonOutput(normalized.length === 0 ? { fil, message } : null);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "message.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="bg-gray-100 min-h-screen p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Structured Message Generator</h1>

        <label className="block mb-4">
          <input type="checkbox" checked={autoValues} onChange={() => setAutoValues(!autoValues)} className="mr-2" />
          Auto-fill message info
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input name="titre" value={infos.titre} onChange={handleInfoChange} disabled={autoValues} placeholder="Thread title" className="p-2 border rounded" />
          <input name="participants" value={infos.participants} onChange={handleInfoChange} disabled={autoValues} placeholder="Participants (comma separated)" className="p-2 border rounded" />
          <input name="expediteur" value={infos.expediteur} onChange={handleInfoChange} disabled={autoValues} placeholder="Sender" className="p-2 border rounded" />
          <input name="texte" value={infos.texte} onChange={handleInfoChange} disabled={autoValues} placeholder="Free text" className="p-2 border rounded" />
          <input name="question" value={infos.question} onChange={handleInfoChange} disabled={autoValues} placeholder="Structured question" className="p-2 border rounded" />
          <input name="options" value={infos.options} onChange={handleInfoChange} disabled={autoValues} placeholder="Options (comma separated)" className="p-2 border rounded" />
        </div>

        <select value={extension} onChange={e => { setExtension(e.target.value); setMessageData({}); setJsonOutput(null); }} className="p-2 border rounded w-full mb-6">
          {Object.entries(extensions).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <div className="bg-white p-4 rounded shadow space-y-4 mb-6">
          {extensions[extension].fields.map(field => (
            <div key={field.name}>
              <label className="block mb-1 font-medium">{field.label}</label>
              {field.type === "checkbox" ? (
                <input type="checkbox" name={field.name} checked={messageData[field.name] || false} onChange={handleChange} />
              ) : (
                <input type={field.type} name={field.name} value={messageData[field.name] || ""} onChange={handleChange} className="w-full border p-2 rounded" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <button onClick={generateJSON} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Generate JSON</button>
          {jsonOutput && (
            <button onClick={downloadJSON} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              Download JSON
            </button>
          )}
        </div>

        {errors.length > 0 && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded">
            <h3 className="font-semibold mb-2">Validation Errors:</h3>
            <ul className="list-disc ml-6 space-y-1">
              {errors.map((e, i) => <li key={i}>{formatError(e)}</li>)}
            </ul>
          </div>
        )}

        {jsonOutput && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Generated JSON:</h2>
            <pre className="bg-white border p-4 rounded max-h-96 overflow-auto">
              {JSON.stringify(jsonOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
