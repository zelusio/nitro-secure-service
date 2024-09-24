import { expect } from 'chai';
import { S3JobLockService } from '../../src/services/jwk/s3JobLock.service';

// These test sets could be run with at least a 30-second interval between runs.
describe('S3JobLockService Tests', function () {
  it('should return "true" only for one', async function () {
    const testJobName = 'testing-1';
    const coinJobLockService1 = new S3JobLockService();
    const coinJobLockService2 = new S3JobLockService();
    const coinJobLockService3 = new S3JobLockService();

    const results = await Promise.all([
      coinJobLockService1.tryLockJob(testJobName, 30000),
      coinJobLockService2.tryLockJob(testJobName, 30000),
      coinJobLockService3.tryLockJob(testJobName, 30000)
    ]);

    expect(results.filter(item => item)).to.be.lengthOf(1);
  });

  it('should return "true" for second tryLockJob after unlockJob', async function () {
    this.timeout(10000);

    const testJobName = 'testing-2';
    const coinJobLockService1 = new S3JobLockService();
    const coinJobLockService2 = new S3JobLockService();

    const firstLockResult = await coinJobLockService1.tryLockJob(testJobName, 30000);
    const secondLockResult = await coinJobLockService2.tryLockJob(testJobName, 30000);
    const unlockResult = await coinJobLockService1.unlockJob(testJobName);
    const result = await coinJobLockService2.tryLockJob(testJobName, 30000);

    expect(firstLockResult).to.be.equal(true);
    expect(secondLockResult).to.be.equal(false);
    expect(unlockResult).to.be.equal(true);
    expect(result).to.be.equal(true);
  });

  it('should return "true" for second tryLockJob attempt because of less expiration', async function () {
    this.timeout(10000);

    const testJobName = 'testing-3';
    const coinJobLockService1 = new S3JobLockService();
    const coinJobLockService2 = new S3JobLockService();

    const firstLockResult = await coinJobLockService1.tryLockJob(testJobName, 30000);
    const secondLockResult = await coinJobLockService2.tryLockJob(testJobName, 30000);
    await new Promise(resolve => setTimeout(resolve, 4000));
    const result = await coinJobLockService2.tryLockJob(testJobName, 2000);

    expect(firstLockResult).to.be.equal(true);
    expect(secondLockResult).to.be.equal(false);
    expect(result).to.be.equal(true);
  });
});
