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
  const idsOfFindings = [];
  const url = `https://api.nhk.or.jp/v2/pg/list/${AREA}/${SERVICE}/${date}.json?key=${APIKEY}`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());
  for(let channel in result.list){
    for(let program of result.list[channel]){
      for(let keyword of keywords){
        if(program.title.includes(keyword)){
          if(idsOfFindings.includes(program.id)){
            continue;
          }
          idsOfFindings.push(program.id);
          findings.push(getSummary(program));
        };
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

function getSummary(program){
  // APIが返す日時文字列（例 "2023-06-20T06:00:00+09:00"）から時刻を切り出す
  const startTime = program.start_time.substring(11, 11 + 8);
  // サービス名共通の接頭辞「NHK」を除く
  const serviceName = program.service.name.substring(3);
  return {
    startDatetime: new Date(program.start_time),
    toString: () => `- ${startTime} [${serviceName}] ${program.title}`,
  }
}
