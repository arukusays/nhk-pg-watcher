// 下記パラメータを別ファイルで定義しておく.
// const APIKEY = 'xxxxxxxxxxxxx';
// const AREA = '000';
// const SERVICE = 'tv';
// const KEYWORDS = ['サッカーの園', '魔改造の夜', 'はなかっぱ'];
// const RECIPIENT = 'xxxxxxx@gmail.com';

function main() {

  const total = {};
  const RETRY_MAX = 3;
  let retry_counter = 0;
  for(let i = 0; i < 8; i++){
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateString = toDateString(date);
    try {
      const results = find(dateString, KEYWORDS);
      Logger.log(`results of ${dateString}: ${results.length}`);
      if(results.length > 0){
        total[dateString] = results;
      }
    } catch (error) {
      Logger.log(`results of ${dateString}: error -> ${error}`);
      if(retry_counter < RETRY_MAX) {
        Logger.log(`retry for ${dateString}. retry_counter: ${retry_counter}.`);
        retry_counter++;
        i--;
      } else {
        Logger.log(`give up getting the data of ${dateString}.`);
        retry_counter = 0;
      }
    }
  }

  Logger.log(`number of days including keywords: ${Object.keys(total).length}`);
  if(Object.keys(total).length > 0){
    let body = ['キーワードを含む番組が見つかりました。'];
    for(let date in total){
      let dateString = new Date(date).toLocaleDateString('ja-JP', {weekday:'short',month:'2-digit',day:'2-digit'});
      body.push(``);
      body.push(`【${dateString}】`);
      body.push(...total[date]);
    }
    body.push(``);
    body.push(`以上`);

    Logger.log('send email');
    const message = {
      name: 'NHK Program Watcher', // the name of the sender
      to: RECIPIENT,
      subject: 'Target Programs were found!!',
      body: body.join(`\n`),
    };
    MailApp.sendEmail(message);
  }

}

function find(date, keywords){
  const findings = [];
  // 重複チェック用
  const seenKeys = new Set();
  const url = `https://program-api.nhk.jp/v3/papiPgDateTv?service=${SERVICE}&area=${AREA}&date=${date}&key=${APIKEY}`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());

  // result のトップレベルは g1 等のキーが来る構造なので Object.keys で回す
  for (const channelKey of Object.keys(result || {})) {
    const channel = result[channelKey];

    // サービス名の取り方を堅牢に（存在チェックとフォールバック）
    const serviceName = channel?.publishedOn?.[0]?.identifierGroup?.shortenedDisplayName
      ?? channel?.publishedOn?.[0]?.identifierGroup?.shortenedName
      ?? channel?.publishedOn?.[0]?.name
      ?? channelKey
      ?? 'NHK';

    const publications = channel?.publication ?? [];
    for (const program of publications) {
      const progNameLower = program.name.toLowerCase();

      for (const keyword of keywords) {
        if (!keyword) continue;
        if (progNameLower.includes(String(keyword).toLowerCase())) {
          // 重複キーは startDate と name の組合せで判定（区切り文字を入れて衝突を避ける）
          const key = `${program?.startDate ?? ''}|${progNameRaw}`;
          if (seenKeys.has(key)) {
            // すでに追加済み
            continue;
          }
          seenKeys.add(key);
          findings.push(getSummary(program, serviceName));
          // 1つの番組につき最初のキーワードヒットだけで良いので内ループは抜ける
          break;
        }
      }
    }
  }

  // startDatetime が null の場合を考慮して安全にソート
  findings.sort((p1, p2) => {
    const t1 = p1.startDatetime instanceof Date && !isNaN(p1.startDatetime) ? p1.startDatetime.getTime() : Infinity;
    const t2 = p2.startDatetime instanceof Date && !isNaN(p2.startDatetime) ? p2.startDatetime.getTime() : Infinity;
    return t1 - t2;
  });

  return findings;
}

function toDateString(d){
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function pad(number){
  if(number < 10){
    return '0' + number;
  }
  return number;
}

function getSummary(program, serviceName){
  // APIが返す日時文字列（例 "2026-01-17T04:15:00+09:00"）から時刻を切り出す
  const startDateStr = program.startDate;
  const startTime = startDateStr.substring(11, 19) || '';
  const startDatetime = startDateStr ? new Date(startDateStr) : null;

  return {
    startDatetime,
    toString: () => `- ${startTime} [${serviceName}] ${program.name}`,
  };
}
