require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB Atlasへの接続
const connectDB = async () => {
  try {
    // 複数の環境変数名に対応
    const mongoURI = process.env.MONGODB_URI || 
                     process.env.MONGODB_URL || 
                     process.env.MONGO_URI || 
                     process.env.MONGO_URL;
    
    if (!mongoURI) {
      console.error('❌ 以下の環境変数のいずれかが設定されている必要があります:');
      console.error('   - MONGODB_URI');
      console.error('   - MONGODB_URL');
      console.error('   - MONGO_URI');
      console.error('   - MONGO_URL');
      throw new Error('MongoDB接続文字列の環境変数が設定されていません。.envファイルを確認してください。');
    }

    await mongoose.connect(mongoURI, {
      // 推奨オプション（Mongoose 6以降はデフォルトで有効）
      serverSelectionTimeoutMS: 5000, // 5秒でタイムアウト
      socketTimeoutMS: 45000, // ソケットタイムアウト
    });

    console.log('✅ MongoDB Atlasへの接続が成功しました');
    console.log(`接続先: ${mongoose.connection.host}`);
    
    // 接続イベントのリスナー
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB接続エラー:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB接続が切断されました');
    });

    // 正常終了時の処理
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB接続が正常に終了しました');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB Atlasへの接続に失敗しました');
    console.error('エラー詳細:', error.message);
    
    // よくあるエラーの原因を案内
    if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.error('\n💡 解決方法:');
      console.error('1. MongoDB Atlasのダッシュボードにログイン');
      console.error('2. Network Access セクションに移動');
      console.error('3. "Add IP Address" をクリック');
      console.error('4. "Allow Access from Anywhere" (0.0.0.0/0) を選択（開発環境の場合）');
      console.error('   または、現在のIPアドレスを追加');
      console.error('5. 数分待ってから再度接続を試してください');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 解決方法:');
      console.error('1. MongoDB Atlasの接続文字列を確認');
      console.error('2. ユーザー名とパスワードが正しいか確認');
      console.error('3. Database Access でユーザーの権限を確認');
    } else if (error.message.includes('DNS')) {
      console.error('\n💡 解決方法:');
      console.error('1. インターネット接続を確認');
      console.error('2. 接続文字列のホスト名が正しいか確認');
    }
    
    // nodemonで実行している場合は、エラーを再スローして呼び出し元で処理
    // 直接実行している場合のみプロセスを終了
    throw error;
  }
};

// 接続テストを実行（直接実行時またはnodemon経由で実行時）
if (require.main === module) {
  (async () => {
    try {
      console.log('🔄 MongoDB Atlasへの接続を試行しています...');
      await connectDB();
      
      // 接続成功後、モデルを読み込んでテスト
      const { User, Book, Note, ProgressHistory } = require('./models');
      console.log('✅ すべてのモデルが正常に読み込まれました');
      console.log('   - User');
      console.log('   - Book');
      console.log('   - Note');
      console.log('   - ProgressHistory');
      
      // 接続を維持（nodemonで実行する場合、接続を維持する）
      console.log('\n✅ 接続が確立されました。接続を維持しています...');
      console.log('   (Ctrl+C で終了)');
    } catch (error) {
      // エラーはconnectDB内で処理されているが、念のため
      console.error('\n⚠️ 接続処理でエラーが発生しました');
      console.error('エラー:', error.message);
      console.error('\n💡 MongoDB Atlasの設定を確認してください。');
      console.error('   設定が完了したら、ファイルを保存するとnodemonが自動的に再起動します。\n');
      
      // nodemonで実行している場合は、エラーでも監視を継続（プロセスを終了しない）
      // 直接実行している場合のみプロセスを終了
      const isNodemon = process.argv.some(arg => arg.includes('nodemon')) || 
                        process.env.npm_lifecycle_event === 'dev';
      
      if (!isNodemon) {
        process.exit(1);
      } else {
        // nodemonで実行している場合、接続を再試行できるようにプロセスを維持
        console.log('📡 nodemonが監視を継続しています。ファイルを保存すると再起動します。\n');
      }
    }
  })();
}

module.exports = connectDB;