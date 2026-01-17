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

  for (const channel in result) {
    const serviceName = result[channel].publishedOn[0].identifierGroup.shortenedDisplayName;
    for (const program of result[channel].publication) {
      const progNameLower = program.name.toLowerCase();
      for (const keyword of keywords) {
        if (progNameLower.includes(keyword.toLowerCase())) {
          // 重複キーは startDate と name の組合せで判定（区切り文字を入れて衝突を避ける）
          const key = `${program.startDate}|${program.name}`;
          if (seenKeys.has(key)) {
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
  findings.sort((p1, p2) => p1.startDatetime - p2.startDatetime);
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
  // APIが返す日時文字列（例 "2023-06-20T06:00:00+09:00"）から時刻を切り出す
  const startTime = program.startDate.substring(11, 11 + 8);
  return {
    startDatetime: new Date(program.startDate),
    toString: () => `- ${startTime} [${serviceName}] ${program.name}`,
  };
}
