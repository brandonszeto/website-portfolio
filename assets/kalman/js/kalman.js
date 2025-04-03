// Simple Kalman Filter for 2D Position/Velocity Tracking
// Use 'export' to make the class available for import
export class KalmanFilter2D {
    constructor({ processNoise = 1e-2, measurementNoise = 1e-1 } = {}) {
        // State: [x, y, vx, vy]' (position and velocity)
        this.x_hat = [0, 0, 0, 0]; // Initial state estimate
        // State Covariance Matrix P: Uncertainty in the state estimate
        this.P = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]; // Initial uncertainty (large)

        // State Transition Matrix F: Predicts next state based on current
        // Updated dynamically based on dt in predict()
        this.F = [
            [1, 0, 0, 0], // x = x + vx*dt
            [0, 1, 0, 0], // y = y + vy*dt
            [0, 0, 1, 0], // vx = vx
            [0, 0, 0, 1]  // vy = vy
        ];

        // Observation Matrix H: Maps state to measurement space
        this.H = [
            [1, 0, 0, 0], // Measure x directly
            [0, 1, 0, 0]  // Measure y directly
        ];

        // Process Noise Covariance Q: Uncertainty in the motion model
        const q = processNoise;
        this.Q = [
            [q, 0, 0, 0],
            [0, q, 0, 0],
            [0, 0, q, 0],
            [0, 0, 0, q]
        ];

        // Measurement Noise Covariance R: Uncertainty in the measurement
        const r = measurementNoise;
        this.R = [
            [r, 0],
            [0, r]
        ];

        this.lastTime = 0;
        this.isInitialized = false;
    }

    // Initialize the filter state with the first measurement
    init(time, measurement) {
        this.x_hat = [measurement[0], measurement[1], 0, 0]; // Assume zero initial velocity
        this.lastTime = time;
        this.isInitialized = true;
    }

    // Predict the next state and covariance
    predict(dt) {
        if (!this.isInitialized || dt <= 0) return; // Added dt check

        // Update State Transition Matrix F based on dt
        this.F[0][2] = dt;
        this.F[1][3] = dt;

        // Predict state: x_hat_minus = F * x_hat
        const x_hat = this.x_hat;
        const x_hat_minus = [
            x_hat[0] + x_hat[2] * dt,
            x_hat[1] + x_hat[3] * dt,
            x_hat[2],
            x_hat[3]
        ];

        // Predict covariance: P_minus = F * P * F' + Q
        const P = this.P;
        const q = this.Q[0][0];
        const P00 = P[0][0] + dt * (P[2][0] + P[0][2]) + dt * dt * P[2][2] + q;
        const P01 = P[0][1] + dt * P[2][1] + dt * P[0][3] + dt * dt * P[2][3];
        const P02 = P[0][2] + dt * P[2][2];
        const P03 = P[0][3] + dt * P[2][3];
        const P10 = P[1][0] + dt * P[3][0] + dt * P[1][2] + dt * dt * P[3][2];
        const P11 = P[1][1] + dt * (P[3][1] + P[1][3]) + dt * dt * P[3][3] + q;
        const P12 = P[1][2] + dt * P[3][2];
        const P13 = P[1][3] + dt * P[3][3];
        const P20 = P[2][0] + dt * P[2][2]; // Corrected from P[2][0] + dt * P[2][2]; Was missing term? No, seems right.
        const P21 = P[2][1] + dt * P[2][3]; // Corrected from P[2][1] + dt * P[2][3];
        const P22 = P[2][2] + q;
        const P23 = P[2][3];
        const P30 = P[3][0] + dt * P[3][2]; // Corrected from P[3][0] + dt * P[3][2];
        const P31 = P[3][1] + dt * P[3][3]; // Corrected from P[3][1] + dt * P[3][3];
        const P32 = P[3][2]; // Corrected from P[3][2]; was missing P[3][2]? No, seems right.
        const P33 = P[3][3] + q;

        const P_minus = [
            [P00, P01, P02, P03],
            [P10, P11, P12, P13],
            [P20, P21, P22, P23],
            [P30, P31, P32, P33]
        ];

        this.x_hat = x_hat_minus;
        this.P = P_minus;
    }


    // Update the state estimate with a new measurement
    update(measurement) {
        if (!this.isInitialized) return;

        const H = this.H;
        const R = this.R;
        const x_hat_minus = this.x_hat;
        const P_minus = this.P;

        // Measurement residual (innovation): y = z - H * x_hat_minus
        const y = [
            measurement[0] - x_hat_minus[0],
            measurement[1] - x_hat_minus[1]
        ];

        // Residual covariance: S = H * P_minus * H' + R
        const S = [
            [P_minus[0][0] + R[0][0], P_minus[0][1]],
            [P_minus[1][0], P_minus[1][1] + R[1][1]]
        ];

        // Calculate determinant safely
        const S_det = S[0][0] * S[1][1] - S[0][1] * S[1][0];
        if (Math.abs(S_det) < 1e-10) {
            console.warn("Kalman Filter: S matrix determinant is near zero. Skipping update.");
            // Potentially reset P or increase noise if this happens often
             this.P = [ [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1] ]; // Reset P as a fallback
            return;
        }
        const S_inv_det = 1.0 / S_det;

        // Optimal Kalman Gain: K = P_minus * H' * inv(S)
        const S_inv = [
            [ S[1][1] * S_inv_det, -S[0][1] * S_inv_det],
            [-S[1][0] * S_inv_det,  S[0][0] * S_inv_det]
        ];
        const K = [
            [ P_minus[0][0] * S_inv[0][0] + P_minus[0][1] * S_inv[1][0], P_minus[0][0] * S_inv[0][1] + P_minus[0][1] * S_inv[1][1] ],
            [ P_minus[1][0] * S_inv[0][0] + P_minus[1][1] * S_inv[1][0], P_minus[1][0] * S_inv[0][1] + P_minus[1][1] * S_inv[1][1] ],
            [ P_minus[2][0] * S_inv[0][0] + P_minus[2][1] * S_inv[1][0], P_minus[2][0] * S_inv[0][1] + P_minus[2][1] * S_inv[1][1] ],
            [ P_minus[3][0] * S_inv[0][0] + P_minus[3][1] * S_inv[1][0], P_minus[3][0] * S_inv[0][1] + P_minus[3][1] * S_inv[1][1] ]
        ];

        // Updated state estimate: x_hat = x_hat_minus + K * y
        this.x_hat = [
            x_hat_minus[0] + K[0][0] * y[0] + K[0][1] * y[1],
            x_hat_minus[1] + K[1][0] * y[0] + K[1][1] * y[1],
            x_hat_minus[2] + K[2][0] * y[0] + K[2][1] * y[1],
            x_hat_minus[3] + K[3][0] * y[0] + K[3][1] * y[1]
        ];

        // Updated covariance: P = (I - K * H) * P_minus
        const I_KH = [
             [1 - K[0][0],    -K[0][1], 0, 0],
             [   -K[1][0], 1 - K[1][1], 0, 0],
             [   -K[2][0],    -K[2][1], 1, 0],
             [   -K[3][0],    -K[3][1], 0, 1]
        ];
        const P_new = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        for(let i=0; i<4; i++) {
            for(let j=0; j<4; j++) {
                for(let l=0; l<4; l++) {
                    P_new[i][j] += I_KH[i][l] * P_minus[l][j];
                }
            }
        }
        this.P = P_new;
    }

    getState() {
        return this.x_hat;
    }

    setMeasurementNoise(noise) {
        const r = Math.max(1e-6, noise); // Ensure noise is positive
        this.R = [[r, 0], [0, r]];
    }
    setProcessNoise(noise) {
         const q = Math.max(1e-6, noise); // Ensure noise is positive
        this.Q = [[q, 0, 0, 0], [0, q, 0, 0], [0, 0, q, 0], [0, 0, 0, q]];
    }
}
