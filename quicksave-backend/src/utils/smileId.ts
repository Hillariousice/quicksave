// import crypto from 'crypto';
// import { env } from '../config/env';
// import { logger } from '../config/logger';

// export const smileIdApi = {
//   async verifyBVN(bvn: string, firstName: string, lastName: string) {
//     const timestamp = new Date().toISOString();
    
//     //  Generate the strict Smile ID cryptographic signature
//     const message = timestamp + env.SMILE_ID_PARTNER_ID + "sid_request";
//     const hmac = crypto.createHmac('sha256', env.SMILE_ID_API_KEY);
//     hmac.update(message);
//     const signature = hmac.digest('base64');

//     const payload = {
//       partner_id: env.SMILE_ID_PARTNER_ID,
//       timestamp: timestamp,
//       signature: signature,
//       country: "NG",
//       id_type: "BVN",
//       id_number: bvn,
//       first_name: firstName,
//       last_name: lastName,
//     };

//     try {
//       const res = await fetch(`${env.SMILE_ID_URL}/id_verification`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
      
//       // Check if Smile ID confirms the identity matches
//       if (data.ResultCode === "1012") {
//         return true; // KYC Passed!
//       }
      
//       logger.warn({ bvn, data }, 'Smile ID verification failed or mismatched');
//       return false;
      
//     } catch (error) {
//       logger.error({ err: error }, 'Smile ID API error');
//       throw new Error('Identity verification service is currently unavailable.');
//     }
//   }
// };