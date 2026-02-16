# qupid - dating made quantum 💘

Qupid is a full-stack app that runs a quantum-inspired relationship simulation. The Flask backend exposes simulation endpoints and serves a built React (Vite) frontend with a liquid-glass visual treatment.

<img width="1345" height="729" alt="Screenshot 2026-02-16 at 1 11 30 PM" src="https://github.com/user-attachments/assets/1944ba76-3f9c-4e5d-93ed-e6fc8ff33ef6" />

<img width="996" height="757" alt="Screenshot 2026-02-16 at 1 11 10 PM" src="https://github.com/user-attachments/assets/b62660cd-8195-49a6-9bd6-30c13054bbb2" />

<img width="1197" height="749" alt="Screenshot 2026-02-16 at 1 14 35 PM" src="https://github.com/user-attachments/assets/12e21b5a-2662-4340-81da-08b1a68f054c" />

<img width="1117" height="743" alt="Screenshot 2026-02-16 at 1 14 11 PM" src="https://github.com/user-attachments/assets/f8ee0d01-cc07-4feb-9e4f-0ed49904361f" />

<img width="1147" height="745" alt="Screenshot 2026-02-16 at 1 16 17 PM" src="https://github.com/user-attachments/assets/b8df441a-8019-4693-8be5-9b7464adbde7" />


## Quantum Backend Features

- Time-dependent, two-qubit Hamiltonian with a periodic drive (Floquet form) to model evolving dynamics.
- Empathy/compatibility couplings map to interaction terms in the Hamiltonian.
- Dissipation and noise channels modeled as Markovian Lindblad operators:
  - Bit-flip, dephasing, and decay for each partner.
  - Anti-correlated dephasing and collective decay for shared dynamics.
- Floquet-Markov solver (`fmmesolve`) in QuTiP to evolve the system across multiple drive periods.
- “Happiness” trajectories computed and graphed from expectation values of `sz` for each partner.
- Full horoscope generated from correlation, trend, and volatility signals.

## Repo Layout
- `qupid/backend`: Flask API + simulation wiring
- `qupid/qupid-app`: React + Vite frontend
- `qupid/qupid_time_dependent_floquet.py`: core simulation
- `qupid/run_script.sh`: end-to-end setup and launch script

## Quick Start
From the repo root:

```bash
./qupid/run_script.sh
```

This will:
- create a Python virtual environment
- install backend requirements
- install frontend dependencies and build the UI
- start the Flask server on `http://localhost:5000`

## Manual Setup
Backend:

```bash
cd qupid
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r backend/requirements.txt
python3 backend/app.py
```

Frontend:

```bash
cd qupid/qupid-app
npm install
npm run build
```

The Flask app serves the built frontend from `qupid/qupid-app/dist`.

## API Endpoints
- `POST /run`: run a simulation with JSON parameters
- `POST /analyze-run`: upload a message file and run analysis + simulation

## Notes
- The backend uses Flask + Flask-CORS.
- The frontend is a Vite React app.
