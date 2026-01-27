require('dotenv').config();
const { sequelize, User, Job } = require('./models');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Reset database
    console.log('Database synced');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const admin = await User.create({
      email: 'admin@jobboard.com',
      password: hashedPassword,
      role: 'admin',
      userType: 'recruiter'
    });
    console.log('Created admin user (recruiter)');

    const recruiter = await User.create({
      email: 'recruiter@jobboard.com',
      password: hashedPassword,
      role: 'user',
      userType: 'recruiter'
    });
    console.log('Created recruiter user');

    const jobSeeker = await User.create({
      email: 'jobseeker@jobboard.com',
      password: hashedPassword,
      role: 'user',
      userType: 'jobseeker'
    });
    console.log('Created job seeker user');

    // Create sample jobs
    const jobs = [
      {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.',
        location: 'San Francisco, CA',
        company: 'TechCorp Inc.',
        userId: recruiter.id
      },
      {
        title: 'Frontend React Developer',
        description: 'Join our team as a React Developer! Build beautiful, responsive user interfaces and work with cutting-edge technologies.',
        location: 'Remote',
        company: 'WebDev Solutions',
        userId: recruiter.id
      },
      {
        title: 'Backend Node.js Engineer',
        description: 'Seeking a talented Backend Engineer with Node.js expertise. Design and implement scalable APIs and microservices.',
        location: 'New York, NY',
        company: 'CloudTech Systems',
        userId: admin.id
      },
      {
        title: 'DevOps Engineer',
        description: 'Help us build and maintain our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
        location: 'Austin, TX',
        company: 'Infrastructure Pro',
        userId: admin.id
      },
      {
        title: 'UI/UX Designer',
        description: 'Creative UI/UX Designer needed to craft amazing user experiences. Strong portfolio and Figma skills required.',
        location: 'Los Angeles, CA',
        company: 'Design Studio',
        userId: recruiter.id
      },
      {
        title: 'Data Scientist',
        description: 'Analyze large datasets and build machine learning models to drive business insights.',
        location: 'Boston, MA',
        company: 'DataTech Analytics',
        userId: admin.id
      },
      {
        title: 'Mobile App Developer',
        description: 'Develop native and cross-platform mobile applications using React Native or Flutter.',
        location: 'Seattle, WA',
        company: 'MobileFirst Apps',
        userId: recruiter.id
      },
      {
        title: 'Product Manager',
        description: 'Lead product development from concept to launch. Define roadmaps and work with cross-functional teams.',
        location: 'Remote',
        company: 'Innovation Labs',
        userId: admin.id
      }
    ];

    for (const jobData of jobs) {
      await Job.create(jobData);
    }

    console.log(`Created ${jobs.length} sample jobs`);
    console.log('\nSample login credentials:');
    console.log('Email: admin@jobboard.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
