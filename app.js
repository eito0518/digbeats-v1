const express = require("express");
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
const PORT = 3000;

// Spotify Web API クライアントの設定
const spotifyApi = new SpotifyWebApi({
    clientId: 'yourClientId',
    clientSecret: 'yourClientSecret',
    redirectUri: 'yourCallbackUri'
});

// POSTリクエストで受け取るデータを解析するためのミドルウェア
app.use(express.urlencoded({extended:true}))

// 静的ファイル（HTML, CSS, JSなど）を提供するためのミドルウェア
app.use(express.static("public"));

// アクセストークンの取得と設定
spotifyApi.clientCredentialsGrant()
    .then((data) => {
        console.log('Access token received');
        spotifyApi.setAccessToken(data.body['access_token']);
    })
    .catch((err) => {
        console.log('Something went wrong when retrieving an access token', err);
    });

// ユーザーから送信された曲名,アーティスト名を取得するルート
app.post("/", (req, res) => {
    const songName = req.body.digSong;
    const artistName = req.body.artistName;

    const query = `track:${songName} artist:${artistName}`;

    // 取得した曲名,アーティスト名を使ってSpotify APIで曲を検索
    spotifyApi.searchTracks(query)
        .then((data) => {
            const tracks = data.body.tracks.items;
            if (tracks.length > 0) {
                const trackId = tracks[0].id; // 最初の結果から曲IDとアーティストIDを取得
                const artistId = tracks[0].artists[0].id;

                // アーティストIDと曲IDをログに表示
                console.log(`Artist ID: ${artistId}`);
                console.log(`Track ID: ${trackId}`);

                // 曲のオーディオパラメータ特徴量を取得
                return spotifyApi.getAudioFeaturesForTrack(trackId)
                    .then(audioFeatures => {
                        const acousticness = audioFeatures.body.acousticness;
                        const danceability = audioFeatures.body.danceability;
                        const energy = audioFeatures.body.energy;
                        const instrumentalness = audioFeatures.body.acousticness;
                        const liveness = audioFeatures.body.liveness;
                        const loudness = audioFeatures.body.loudness;
                        const speechiness = audioFeatures.body.speechiness;
                        const valence = audioFeatures.body.valence;
                        const tempo = audioFeatures.body.tempo;
                        const key = audioFeatures.body.key;
                        const mode = audioFeatures.body.mode;
                        const time_signature = audioFeatures.body.time_signature;
                        
                        // オーディオパラメータをログに表示
                        console.log(`danceability: ${danceability}`);
                        console.log(`energy: ${energy}`);
                        console.log(`tempo: ${tempo}`);
                        console.log(`valence: ${valence}`);

                        // オーディオパラメータの範囲を任意に設定
                        // const minDanceability = Math.max(0, danceability - 0.1); 
                        // const maxDanceability = Math.min(1, danceability + 0.1);
                        // const minEnergy = Math.max(0, energy - 0.1);
                        // const maxEnergy = Math.min(1, energy + 0.1);
                        // const minTempo = Math.max(0, tempo - 10); // BPM
                        // const maxTempo = tempo + 10;

                        // 取得した曲IDを使って、類似した曲をレコメンド(パラメータをカスタマイズ)
                        return spotifyApi.getRecommendations({
                            seed_tracks: [trackId],

                            // target_acousticness: acousticness,
                            target_danceability: danceability,
                            target_energy: energy,
                            // target_instrumentalness: instrumentalness,
                            // target_liveness: liveness,
                            // target_loudness: loudness,
                            // target_speechiness: speechiness,
                            target_valence: valence,
                            target_tempo: tempo,
                            // target_key: key,
                            // target_mode: mode,
                            // target_time_signature:time_signature,


                            // min_danceability: minDanceability,
                            // max_danceability: maxDanceability,
                            // min_energy: minEnergy,
                            // max_energy: maxEnergy,
                            // min_tempo: minTempo,
                            // max_tempo: maxTempo

                            limit: 50
                        });
                    });
            } else {
                throw new Error("曲が見つかりませんでした");
            }
        })
        .then((data) => {
            const recommendations = data.body.tracks.slice(0, 50); // レコメンドされた上位50曲を取得

            // ユーザーにレコメンドされた曲を表示
            res.send(`
                <h1>「${songName}」に似た上位50の曲のリスト:</h1>
                <ul>
                    ${recommendations.map(track => 
                        `<li>${track.name} by ${track.artists.map(artist => artist.name).join(', ')}</li>`
                    ).join('')}
                </ul>
                <a href="/">戻る</a>
            `);
        })
        .catch((err) => {
            // ルートのエラーハンドリング
            console.error(err);
            res.status(500).send("エラーが発生しました: ");
        });
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました`);
});
