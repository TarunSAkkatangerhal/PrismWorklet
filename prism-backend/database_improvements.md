# Database Improvements for Mentor-Worklet Relationships

## Current Issues
1. Single mentor per worklet limitation
2. No proper many-to-many relationships
3. Redundant mentor tables
4. Missing foreign key constraints

## Recommended Solution: Junction Table Approach

### 1. Create Junction Table
```sql
CREATE TABLE mentor_worklet_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mentor_id INT NOT NULL,
    worklet_id INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role_type ENUM('Primary', 'Secondary', 'Collaborator') DEFAULT 'Primary',
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by INT, -- Who assigned this mentor
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worklet_id) REFERENCES worklets(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_mentor_worklet (mentor_id, worklet_id)
);
```

### 2. Update Models (SQLAlchemy)
```python
# In models.py - Add new junction table model
class MentorWorkletAssignment(Base):
    __tablename__ = "mentor_worklet_assignments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    mentor_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    worklet_id = Column(Integer, ForeignKey('worklets.id'), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    role_type = Column(Enum("Primary", "Secondary", "Collaborator"), default="Primary")
    is_active = Column(Boolean, default=True)
    assigned_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="worklet_assignments")
    worklet = relationship("Worklet", back_populates="mentor_assignments")
    assigner = relationship("User", foreign_keys=[assigned_by])

# Update User model
class User(Base):
    # ... existing fields ...
    worklet_assignments = relationship("MentorWorkletAssignment", 
                                     foreign_keys="MentorWorkletAssignment.mentor_id",
                                     back_populates="mentor")

# Update Worklet model  
class Worklet(Base):
    # ... existing fields ...
    # Keep mentor_id for backward compatibility but make it optional
    mentor_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # New relationship
    mentor_assignments = relationship("MentorWorkletAssignment", back_populates="worklet")
    primary_mentor = relationship("User", foreign_keys=[mentor_id])
```

### 3. Migration Strategy
```python
# Create migration script
def upgrade_database():
    # 1. Create new junction table
    # 2. Migrate existing mentor_id data to junction table
    # 3. Update API endpoints to use junction table
    # 4. Keep mentor_id column for backward compatibility initially
    
    # Sample migration for existing data:
    existing_assignments = db.query(Worklet).filter(Worklet.mentor_id.isnot(None)).all()
    for worklet in existing_assignments:
        assignment = MentorWorkletAssignment(
            mentor_id=worklet.mentor_id,
            worklet_id=worklet.id,
            role_type="Primary"
        )
        db.add(assignment)
    db.commit()
```

### 4. Updated API Endpoints
```python
# Get mentors for a worklet
@router.get("/{worklet_id}/mentors")
def get_worklet_mentors(worklet_id: int, db: Session = Depends(get_db)):
    assignments = db.query(MentorWorkletAssignment).filter(
        MentorWorkletAssignment.worklet_id == worklet_id,
        MentorWorkletAssignment.is_active == True
    ).all()
    return [{"mentor": assignment.mentor, "role": assignment.role_type} for assignment in assignments]

# Get worklets for a mentor
@router.get("/mentor/{mentor_id}/worklets")
def get_mentor_worklets(mentor_id: int, db: Session = Depends(get_db)):
    assignments = db.query(MentorWorkletAssignment).filter(
        MentorWorkletAssignment.mentor_id == mentor_id,
        MentorWorkletAssignment.is_active == True
    ).all()
    return [assignment.worklet for assignment in assignments]

# Assign mentor to worklet
@router.post("/{worklet_id}/assign-mentor")
def assign_mentor_to_worklet(worklet_id: int, assignment_data: MentorAssignmentSchema, db: Session = Depends(get_db)):
    assignment = MentorWorkletAssignment(
        mentor_id=assignment_data.mentor_id,
        worklet_id=worklet_id,
        role_type=assignment_data.role_type,
        assigned_by=assignment_data.assigned_by
    )
    db.add(assignment)
    db.commit()
    return {"message": "Mentor assigned successfully"}
```

## Alternative Approaches

### Option 2: JSON Array in Worklet Table
```sql
ALTER TABLE worklets ADD COLUMN mentor_ids JSON;
-- Store mentor IDs as JSON array: [1, 2, 3]
```

### Option 3: Separate Mentor Roles Table
```sql
CREATE TABLE worklet_mentors (
    worklet_id INT,
    mentor_id INT,
    role ENUM('Lead', 'Assistant', 'Consultant'),
    PRIMARY KEY (worklet_id, mentor_id)
);
```

## Benefits of Junction Table Approach

1. ✅ **Multiple Mentors per Worklet**: Each worklet can have many mentors
2. ✅ **Multiple Worklets per Mentor**: Each mentor can work on many worklets  
3. ✅ **Role Flexibility**: Primary, Secondary, Collaborator roles
4. ✅ **Audit Trail**: Track who assigned mentors and when
5. ✅ **Soft Deletes**: Deactivate assignments without losing history
6. ✅ **Scalable**: Easy to add more relationship attributes
7. ✅ **Standard Pattern**: Industry-standard many-to-many approach

## Implementation Priority

1. **Phase 1**: Create junction table and models
2. **Phase 2**: Migrate existing data 
3. **Phase 3**: Update API endpoints
4. **Phase 4**: Update frontend to handle multiple mentors
5. **Phase 5**: Remove redundant mentor_id column (optional)

## Frontend Updates Needed

1. **Mentor Selection**: Multi-select dropdowns for worklet assignment
2. **Worklet Cards**: Display multiple mentor names
3. **Assignment Interface**: UI for managing mentor-worklet relationships
4. **Role Management**: UI for setting mentor roles (Primary/Secondary/Collaborator)