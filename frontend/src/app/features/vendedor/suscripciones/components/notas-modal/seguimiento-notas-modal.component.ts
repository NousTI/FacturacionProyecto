import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-seguimiento-notas-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn" (click)="onClose.emit()">
      <div class="modal-container-note shadow-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-note">
          <h2 class="modal-title-note">Notas de Seguimiento</h2>
          <button (click)="onClose.emit()" class="btn-close-note">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-note">
          <p class="text-muted small mb-3">
             Registro de contacto y gestión de cobranza para <strong>{{ empresaName }}</strong>.
             <br> <i class="bi bi-info-circle me-1"></i> Estas notas son privadas para el equipo comercial.
          </p>

          <!-- LIST OF NOTES (Mocked/Static for now if DB doesn't support) -->
          <div class="notes-timeline mb-4">
             <div *ngIf="notes.length === 0" class="text-center py-4 text-muted small border rounded-3 bg-light">
                No hay notas registradas aún.
             </div>

             <div *ngFor="let note of notes" class="note-item animate__animated animate__fadeIn">
                <div class="note-date">{{ note.date | date:'short' }}</div>
                <div class="note-content">{{ note.text }}</div>
             </div>
          </div>

          <!-- ADD NOTE -->
          <div class="add-note-area">
             <label class="form-label small fw-bold text-secondary">Nueva Nota</label>
             <textarea 
                [(ngModel)]="newNote" 
                class="form-control shadow-none" 
                rows="3" 
                placeholder="Escribe el resultado de la llamada, compromiso de pago, etc..."
             ></textarea>
          </div>

        </div>

        <div class="modal-footer-note">
          <button (click)="onClose.emit()" class="btn-secondary-note">Cerrar</button>
          <button (click)="saveNote()" [disabled]="!newNote.trim()" class="btn-primary-note">
            Guardar Nota
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center; z-index: 10002;
    }
    .modal-container-note {
      background: #ffffff; width: 500px; max-width: 90vw;
      border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header-note {
      padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-title-note { font-size: 1.1rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-note { background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer; }
    
    .modal-body-note { padding: 1.5rem; }

    .notes-timeline {
        max-height: 200px; overflow-y: auto;
        display: flex; flex-direction: column; gap: 0.75rem;
    }
    .note-item {
        background: #f8fafc; padding: 0.75rem; border-radius: 12px; border: 1px solid #e2e8f0;
    }
    .note-date { font-size: 0.7rem; color: #94a3b8; margin-bottom: 0.25rem; font-weight: 700; }
    .note-content { font-size: 0.85rem; color: #334155; line-height: 1.4; }

    .modal-footer-note {
      padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0;
      display: flex; justify-content: flex-end; gap: 0.75rem;
    }
    .btn-primary-note {
      background: #161d35; color: white; border: none; padding: 0.5rem 1.5rem;
      border-radius: 10px; font-weight: 700; font-size: 0.9rem;
    }
    .btn-primary-note:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary-note {
      background: white; color: #64748b; border: 1px solid #e2e8f0; padding: 0.5rem 1.5rem;
      border-radius: 10px; font-weight: 600; font-size: 0.9rem;
    }
    .shadow-premium { box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25); }
  `]
})
export class SeguimientoNotasModalComponent implements OnInit {
    @Input() empresaName: string = '';
    @Input() empresaId: string = '';
    @Output() onClose = new EventEmitter<void>();

    notes: any[] = [];
    newNote: string = '';

    constructor() { }

    ngOnInit() {
        // Mock loading notes
        // In real implementation, fetch from service using this.empresaId
        this.notes = [
            { date: new Date(Date.now() - 86400000 * 2), text: 'Cliente contactado, procederá el pago el viernes.' }
        ];
    }

    saveNote() {
        if (!this.newNote.trim()) return;

        const note = {
            date: new Date(),
            text: this.newNote
        };

        this.notes.unshift(note);
        this.newNote = '';

        // Here call service to save note
        console.log('Saving note for', this.empresaId, note);
    }
}
