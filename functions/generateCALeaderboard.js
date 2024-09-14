var fs = require("fs");
var axios = require('axios');
require('dotenv').config();

let leaderboard = {};

async function generateCALeaderboard() {
    try {
        const [caDataRes, contributorDataRes, mentorDataRes, paDataRes] = await Promise.all([
            axios.get(`https://opensheet.elk.sh/1v7G6EICAMtZtf1B4KuzJI_VNQE2YmKjNusu_wPPOw6g/1`),
            axios.get(`https://opensheet.elk.sh/1rCkCtw-DS8q2awBcFFM1KtAYen2HZD2hHg41v7ek2lA/1`),
            axios.get(`https://opensheet.elk.sh/1YK8yZQ43C9r8ucXs3m3hDzt6ksDwz89WHyaIt7U7RlE/1`), 
            axios.get(`https://opensheet.elk.sh/1rCkCtw-DS8q2awBcFFM1KtAYen2HZD2hHg41v7ek2lA/1`) 
        ]);
        
        leaderboard = {};  
        let caData = caDataRes.data;
        let contributorData = contributorDataRes.data;
        let mentorData = mentorDataRes.data;  
        let paData = paDataRes.data;      
 
        for (let m = 0; m < caData.length; m++) {
            let referral_code = caData[m].referralCode;
            leaderboard[referral_code] = {
                caName: caData[m].name,
                referralCode: referral_code,
                referralCount: 0 
            };
        }

        for (let i = 0; i < contributorData.length; i++) {
            let contributorReferralCode = contributorData[i].referralCode;
            if (leaderboard[contributorReferralCode]) {
                leaderboard[contributorReferralCode].referralCount += 1;  
            }
        }

        for (let i = 0; i < mentorData.length; i++) {
            let mentorReferralCode = mentorData[i].referralCode;
            if (leaderboard[mentorReferralCode]) {
                leaderboard[mentorReferralCode].referralCount += 1;  
            }
        }

        for (let i = 0; i < paData.length; i++) {
            let paReferralCode = paData[i].referralCode;
            if (leaderboard[paReferralCode]) {
                leaderboard[paReferralCode].referralCount += 1;  
            }
        }

        console.log("CALeaderboard generated");

        let leaderboardArray = Object.keys(leaderboard).map(key => leaderboard[key]);
        leaderboardArray.sort((a, b) => b.referralCount - a.referralCount);

        let json = {
            leaderboard: leaderboardArray,
            success: true,
            updatedAt: +new Date(),
            generated: true,
            updatedTimestring: new Date().toLocaleString()
        };

        await fs.promises.truncate('caLeaderboard.json');
        console.log('CALeaderboard file truncated'); 

        await fs.promises.writeFile('caLeaderboard.json', JSON.stringify(json), 'utf8');
        console.log('caLeaderboard.json was updated');
    } catch (error) {
        console.error('Error generating leaderboard:', error);
    }
}

module.exports.generateCALeaderboard = generateCALeaderboard;
