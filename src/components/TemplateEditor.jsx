/**
 * Template Editor Component
 * Allows editing weekly templates
 */
import React, { useState, useEffect } from 'react';
import { WEEKDAYS, WEEKDAY_NAMES, SHIFT_TIMES } from '../utils/constants.js';
import './TemplateEditor.css';

function TemplateEditor({ employees, templates, onSaveTemplates }) {
  const [currentTemplateId, setCurrentTemplateId] = useState('template1');
  const [currentTemplate, setCurrentTemplate] = useState(null);

  useEffect(() => {
    if (templates.length > 0) {
      const template = templates.find(t => t.id === currentTemplateId) || templates[0];
      setCurrentTemplate(template);
      setCurrentTemplateId(template.id);
    }
  }, [templates, currentTemplateId]);

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplate(template);
      setCurrentTemplateId(templateId);
    }
  };

  const handleSave = () => {
    const updatedTemplates = templates.map(t =>
      t.id === currentTemplateId ? currentTemplate : t
    );
    onSaveTemplates(updatedTemplates);
  };

  if (!currentTemplate) {
    return <div className="loading">Loading template...</div>;
  }

  return (
    <div className="template-editor">
      <div className="template-editor-header">
        <h2>Template Semanal</h2>
        <div className="template-selector">
          <label>Template:</label>
          <select
            value={currentTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="info-text">
        Define el horario base semanal que se aplicará a todos los meses. Los turnos de mañana son de {SHIFT_TIMES.morning.start}-{SHIFT_TIMES.morning.end} ({SHIFT_TIMES.morning.duration}h) y los de tarde de {SHIFT_TIMES.afternoon.start}-{SHIFT_TIMES.afternoon.end} ({SHIFT_TIMES.afternoon.duration}h).
      </p>

      <div className="template-grid">
        {WEEKDAYS.map((weekday, index) => (
          <div key={weekday} className="template-day">
            <h3>{WEEKDAY_NAMES[index]}</h3>
            <div className="template-shifts">
              <div className="template-shift">
                <div className="shift-header">Mañana</div>
                <div className="shift-slots">
                  {/* Reception slot */}
                  <div className="slot reception-slot">
                    <label>Recepción</label>
                    {/* Template editing UI would go here */}
                  </div>
                  {/* Internal/External slots */}
                  <div className="slot">
                    <label>Interno/Externo</label>
                    {/* Template editing UI would go here */}
                  </div>
                </div>
              </div>
              <div className="template-shift">
                <div className="shift-header">Tarde</div>
                <div className="shift-slots">
                  <div className="slot reception-slot">
                    <label>Recepción</label>
                  </div>
                  <div className="slot">
                    <label>Interno/Externo</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="template-actions">
        <button className="btn-primary" onClick={handleSave}>
          Guardar Template
        </button>
      </div>
    </div>
  );
}

export default TemplateEditor;

